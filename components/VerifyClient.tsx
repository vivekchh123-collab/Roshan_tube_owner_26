'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIcon } from './Icons';
import { useApp } from './Providers';
import { compressImage } from '@/lib/image';
import { resolveIssue } from '@/app/actions';

type Check = { label: string; a: string; b: string; ok: boolean | null; score?: number };
type Result = { mismatched: boolean; checks: Check[]; problems: string[]; whatsapp: boolean };
export type Issue = { id: string; customer_name: string; mobile: string | null; problem: string };

export default function VerifyClient({ issues }: { issues: Issue[] }) {
  const { tx } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<'name' | null>(null);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [files, setFiles] = useState<{ aadhaar: File | null; pan: File | null; bill: File | null }>({ aadhaar: null, pan: null, bill: null });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [res, setRes] = useState<Result | null>(null);

  async function run() {
    setErr(''); setRes(null);
    if (!name.trim() || mobile.length !== 10) { setErr(tx('Enter name and 10-digit mobile.', 'नाम और 10 अंकों का मोबाइल लिखें।')); return; }
    if (!files.aadhaar || !files.pan || !files.bill) { setErr(tx('Upload all three images.', 'तीनों फोटो अपलोड करें।')); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.set('name', name); fd.set('mobile', mobile);
      for (const k of ['aadhaar', 'pan', 'bill'] as const) fd.set(k, await compressImage(files[k]!, 1400, 0.75), `${k}.jpg`);
      const r = await fetch('/api/verify', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Failed');
      setRes(j);
      router.refresh();
    } catch (e) { setErr(String((e as Error).message || e)); }
    finally { setBusy(false); }
  }

  const pick = (k: 'aadhaar' | 'pan' | 'bill', en: string, hi: string) => (
    <div>
      <label className="label">{tx(en, hi)}</label>
      <input type="file" accept="image/*" className="input" onChange={(e) => setFiles((f) => ({ ...f, [k]: e.target.files?.[0] ?? null }))} />
    </div>
  );

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={() => setMode('name')} className={`card text-left font-bold ${mode === 'name' ? 'ring-2 ring-brand-blue' : ''}`}>1. {tx('Check name correction', 'नाम सुधार जाँचें')}</button>
        <button disabled className="card text-left font-bold opacity-60">2. {tx('Check bank link', 'बैंक लिंक जाँचें')} <span className="ml-1 rounded-full bg-brand-sun px-2 py-0.5 text-xs text-black">{tx('Coming soon', 'जल्द आ रहा है')}</span></button>
      </div>

      {mode === 'name' && (
        <div className="card mt-4 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div><label className="label">{tx('Name of customer', 'ग्राहक का नाम')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><label className="label">{tx('Phone number', 'फोन नंबर')}</label><input className="input" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} /></div>
          </div>
          {pick('aadhaar', 'Upload Aadhaar card image', 'आधार कार्ड फोटो अपलोड करें')}
          {pick('pan', 'Upload PAN card image', 'पैन कार्ड फोटो अपलोड करें')}
          {pick('bill', 'Upload electric bill connection image', 'बिजली बिल कनेक्शन फोटो अपलोड करें')}
          <p className="text-xs text-slate-500">{tx('Images are read once and never stored. Only a mismatch note (name, mobile, problem) is saved.', 'फोटो सिर्फ एक बार पढ़ी जाती हैं, सेव नहीं होतीं। केवल मिसमैच नोट (नाम, मोबाइल, समस्या) सेव होता है।')}</p>
          {err && <p className="text-sm font-semibold text-brand-red">{err}</p>}
          <button className="btn w-full" onClick={run} disabled={busy}>{busy ? tx('Reading documents…', 'दस्तावेज़ पढ़ रहे हैं…') : tx('Check names', 'नाम जाँचें')}</button>

          {res && (
            <div className={`rounded-xl p-3 ${res.mismatched ? 'bg-red-50 dark:bg-red-950' : 'bg-green-50 dark:bg-green-950'}`}>
              <p className="font-bold">{res.mismatched ? '⚠️ ' + tx('Mismatch found', 'मिसमैच मिला') : '✅ ' + tx('All names match', 'सभी नाम मेल खाते हैं')}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {res.checks.map((c, i) => (
                  <li key={i}>{c.ok === null ? '❔' : c.ok ? '✅' : '❌'} {c.label}: <b>{c.a}</b> ↔ <b>{c.b}</b></li>
                ))}
              </ul>
              {res.problems.filter((p) => p.includes('not readable')).map((p, i) => <p key={i} className="mt-1 text-xs text-amber-700 dark:text-amber-300">{p}</p>)}
              {res.mismatched && <p className="mt-2 text-xs text-slate-500">{res.whatsapp ? tx('Owner alert sent.', 'ओनर को अलर्ट भेजा गया।') : tx('Alert could not be sent; see list below.', 'अलर्ट नहीं जा सका; नीचे सूची देखें।')}</p>}
            </div>
          )}
        </div>
      )}

      <h2 className="mt-8 text-lg font-extrabold">{tx('Name / father-name mismatch list', 'नाम / पिता के नाम मिसमैच सूची')} ({issues.length})</h2>
      <ul className="mt-2 space-y-2">
        {issues.map((i) => (
          <li key={i.id} className="card !p-3">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{i.customer_name}</p><p className="text-sm text-slate-500">{i.mobile}</p></div>
              {i.mobile && <a href={`tel:+91${i.mobile}`} aria-label="Call" className="rounded-full bg-green-600 p-3 text-white"><PhoneIcon width={20} height={20} /></a>}
            </div>
            <p className="mt-2 text-sm text-brand-red">{i.problem}</p>
            <button className="mt-2 text-xs font-bold text-brand-blue" onClick={async () => { await resolveIssue(i.id); router.refresh(); }}>{tx('Mark resolved', 'हल हो गया')}</button>
          </li>
        ))}
      </ul>
      {issues.length === 0 && <p className="py-4 text-slate-500">{tx('No mismatches.', 'कोई मिसमैच नहीं।')}</p>}
    </>
  );
}
