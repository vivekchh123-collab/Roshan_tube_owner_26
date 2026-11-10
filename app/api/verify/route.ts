import { NextResponse } from 'next/server';
import { assertOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { namesMatch, similarity } from '@/lib/match';
import { notifyOwner } from '@/lib/notify';

export const runtime = 'nodejs';
export const maxDuration = 60;

type Doc = { name: string | null; father_name: string | null };
const KEYS = ['aadhaar', 'pan', 'bill'] as const;
const LABEL = { aadhaar: 'Aadhaar', pan: 'PAN', bill: 'Electricity bill' } as const;

// Reads the three document photos with Claude vision, compares names, and keeps NOTHING:
// images are never written to disk or the database. Only a mismatch note (name, mobile, problem) is saved.
export async function POST(req: Request) {
  try { await assertOwner(); } catch { return NextResponse.json({ error: 'Not allowed' }, { status: 403 }); }
  const f = await req.formData();
  const name = String(f.get('name') || '').trim().slice(0, 100);
  const mobile = String(f.get('mobile') || '').replace(/\D/g, '');
  if (!name || mobile.length !== 10) return NextResponse.json({ error: 'Enter customer name and 10-digit mobile.' }, { status: 400 });

  const content: unknown[] = [];
  for (const k of KEYS) {
    const file = f.get(k);
    if (!(file instanceof File) || file.size === 0 || !file.type.startsWith('image/') || file.size > 3 * 1024 * 1024)
      return NextResponse.json({ error: `Upload a clear ${LABEL[k]} image (max 3 MB).` }, { status: 400 });
    content.push({ text: `${LABEL[k]}:` });
    content.push({ inline_data: { mime_type: 'image/jpeg', data: Buffer.from(await file.arrayBuffer()).toString('base64') } });
  }
  content.push({
    text:
      'These are three Indian documents in this order: Aadhaar card, PAN card, electricity bill. For a name-consistency check, return ONLY a JSON object, no other text:\n' +
      '{"aadhaar":{"name":string|null,"father_name":string|null},"pan":{"name":string|null,"father_name":string|null},"bill":{"name":string|null,"father_name":string|null}}\n' +
      'Rules: write names in English (Roman) letters, transliterating Hindi if needed. father_name = the S/O, D/O, W/O or C/O name on Aadhaar; "Father\'s Name" on PAN; the father/husband name on the bill if printed. Use null when not visible or unreadable. Never include any ID, account or phone numbers.',
  });

  let docs: Record<(typeof KEYS)[number], Doc>;
  try {
    // Google Gemini (free tier). Model is configurable in case Google renames/retires one.
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY || '', 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: content }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0, maxOutputTokens: 600 },
      }),
    });
    if (r.status === 429) return NextResponse.json({ error: 'Free daily/minute limit reached. Wait a minute and try again.' }, { status: 429 });
    if (!r.ok) return NextResponse.json({ error: 'Document reader unavailable. Check GEMINI_API_KEY / GEMINI_MODEL.' }, { status: 502 });
    const j = await r.json();
    const text: string = (j.candidates?.[0]?.content?.parts || []).map((c: { text?: string }) => c.text || '').join('');
    docs = JSON.parse(text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1));
  } catch {
    return NextResponse.json({ error: 'Could not read the documents. Retake clearer photos.' }, { status: 422 });
  }

  const problems: string[] = [];
  const checks: { label: string; a: string; b: string; ok: boolean | null; score?: number }[] = [];

  for (const k of KEYS) {
    const d = docs[k] ?? { name: null, father_name: null };
    if (!d.name) { problems.push(`${LABEL[k]}: name not readable — retake photo`); checks.push({ label: `Customer name vs ${LABEL[k]}`, a: name, b: '—', ok: null }); continue; }
    const ok = namesMatch(name, d.name);
    checks.push({ label: `Customer name vs ${LABEL[k]}`, a: name, b: d.name, ok, score: similarity(name, d.name) });
    if (!ok) problems.push(`Customer name "${name}" does not match ${LABEL[k]} name "${d.name}"`);
  }
  for (let i = 0; i < KEYS.length; i++)
    for (let j = i + 1; j < KEYS.length; j++) {
      const a = docs[KEYS[i]]?.father_name, b = docs[KEYS[j]]?.father_name;
      if (!a || !b) continue;
      const ok = namesMatch(a, b);
      checks.push({ label: `Father name: ${LABEL[KEYS[i]]} vs ${LABEL[KEYS[j]]}`, a, b, ok, score: similarity(a, b) });
      if (!ok) problems.push(`Father name differs: ${LABEL[KEYS[i]]} "${a}" vs ${LABEL[KEYS[j]]} "${b}"`);
    }

  const mismatched = checks.some((c) => c.ok === false);
  let whatsapp = false;
  if (mismatched) {
    const problem = problems.filter((p) => !p.includes('not readable')).join('; ').slice(0, 500);
    await db().from('verification_issues').insert({ customer_name: name, mobile, problem });
    const n = await notifyOwner('⚠️ NAME MISMATCH', `Customer: ${name}\nMobile: ${mobile}\nProblem: ${problem}`);
    whatsapp = n.ok;
  }
  return NextResponse.json({ ok: true, mismatched, checks, problems, whatsapp });
}
