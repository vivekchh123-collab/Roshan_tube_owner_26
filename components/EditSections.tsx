'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from './Providers';
import { compressImage } from '@/lib/image';
import {
  addAd, addBrand, deleteAd, deleteBrand, deletePlan, saveAnnouncement, saveBrand, savePlan,
  sendNotification, setBrandImage, setCareers,
} from '@/app/actions';

export type Brand = { id: string; name: string; tag: string | null; note: string | null; image_url: string | null; coming_soon: boolean };
export type Plan = { id: string; brand_id: string; category: 'on-grid' | 'hybrid'; title: string; details: string; total_cost: number | null; subsidy: number; net_cost: number | null; per_kw_price: number | null; sort: number };
export type Ad = { id: string; image_url: string };

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="card mt-5 space-y-3"><h2 className="text-lg font-extrabold">{title}</h2>{children}</section>
);

async function imgForm(file: File) {
  const fd = new FormData();
  fd.set('file', await compressImage(file, 1600, 0.8), 'image.jpg');
  return fd;
}

export function NotifySender() {
  const { tx } = useApp();
  const [title, setTitle] = useState(''); const [body, setBody] = useState(''); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  async function send() {
    setBusy(true); setMsg('');
    const r = await sendNotification(title, body);
    setBusy(false);
    if (!r.ok) { setMsg(r.error || 'Failed'); return; }
    setMsg(r.skipped ? tx('Saved to the bell. Phone push not configured (VAPID keys).', 'बेल में सेव हुआ। फोन पुश कॉन्फ़िगर नहीं है (VAPID keys)।') : tx(`Sent to ${r.sent} phone(s), ${r.failed} failed.`, `${r.sent} फोन पर भेजा, ${r.failed} विफल।`));
    setTitle(''); setBody('');
  }
  return (
    <Section title={tx('Send notification', 'सूचना भेजें')}>
      <input className="input" placeholder={tx('Title', 'शीर्षक')} value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input" rows={3} placeholder={tx('Message', 'संदेश')} value={body} onChange={(e) => setBody(e.target.value)} />
      {msg && <p className="text-sm font-semibold text-brand-blue">{msg}</p>}
      <button className="btn w-full" onClick={send} disabled={busy}>{tx('Send to website bell + phones', 'वेबसाइट बेल + फोन पर भेजें')}</button>
    </Section>
  );
}

export function AnnouncementEditor({ en, hi }: { en: string; hi: string }) {
  const { tx } = useApp();
  const [a, setA] = useState(en); const [b, setB] = useState(hi); const [ok, setOk] = useState(false);
  return (
    <Section title={tx('Announcement (running text under the menu)', 'घोषणा (मेन्यू के नीचे चलने वाला टेक्स्ट)')}>
      <div><label className="label">English</label><input className="input" value={a} onChange={(e) => setA(e.target.value)} /></div>
      <div><label className="label">हिंदी</label><input className="input" value={b} onChange={(e) => setB(e.target.value)} /></div>
      <button className="btn w-full" onClick={async () => { await saveAnnouncement(a, b); setOk(true); setTimeout(() => setOk(false), 1500); }}>{ok ? '✓ ' + tx('Saved', 'सेव हुआ') : tx('Save announcement', 'घोषणा सेव करें')}</button>
    </Section>
  );
}

export function AdsEditor({ ads }: { ads: Ad[] }) {
  const { tx } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  async function add(f: File | undefined) {
    if (!f) return;
    setBusy(true); setErr('');
    const r = await addAd(await imgForm(f));
    setBusy(false);
    if (!r.ok) setErr(r.error || 'Failed');
    router.refresh();
  }
  return (
    <Section title={tx('Advertisement images (slider)', 'विज्ञापन इमेज (स्लाइडर)')}>
      <p className="text-xs text-slate-500">{tx('2 or more images slide automatically; a single image stays still. Best size: wide 16:7.', '2 या अधिक इमेज अपने-आप चलती हैं; एक इमेज स्थिर रहती है। सबसे अच्छा आकार: चौड़ा 16:7।')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {ads.map((a) => (
          <div key={a.id} className="relative overflow-hidden rounded-xl">
            <img src={a.image_url} alt="" className="aspect-[16/7] w-full object-cover" />
            <button onClick={async () => { await deleteAd(a.id); router.refresh(); }} className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-bold text-white">✕</button>
          </div>
        ))}
      </div>
      {err && <p className="text-sm text-brand-red">{err}</p>}
      <label className="btn w-full cursor-pointer">{busy ? tx('Uploading…', 'अपलोड हो रहा है…') : '＋ ' + tx('Add advertisement image', 'विज्ञापन इमेज जोड़ें')}
        <input type="file" accept="image/*" hidden onChange={(e) => { add(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </Section>
  );
}

export function CareersToggles({ technical, field }: { technical: boolean; field: boolean }) {
  const { tx } = useApp();
  const [t, setT] = useState(technical); const [f, setF] = useState(field);
  const Row = ({ label, on, set, k }: { label: string; on: boolean; set: (v: boolean) => void; k: 'careers_technical' | 'careers_field' }) => (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <span className="font-semibold">{label}</span>
      <input type="checkbox" className="h-5 w-5 accent-brand-blue" checked={on} onChange={async (e) => { set(e.target.checked); await setCareers(k, e.target.checked); }} />
    </label>
  );
  return (
    <Section title={tx('Careers page: show / hide roles', 'करियर पेज: रोल दिखाएँ / छिपाएँ')}>
      <Row label={tx('Technical role', 'टेक्निकल रोल')} on={t} set={setT} k="careers_technical" />
      <Row label={tx('Field work role', 'फील्ड वर्क रोल')} on={f} set={setF} k="careers_field" />
    </Section>
  );
}

function PlanRow({ plan, brandId }: { plan?: Plan; brandId: string }) {
  const { tx } = useApp();
  const router = useRouter();
  const [p, setP] = useState({
    category: plan?.category ?? 'on-grid', title: plan?.title ?? '', details: plan?.details ?? '',
    total: plan?.total_cost?.toString() ?? '', subsidy: plan?.subsidy?.toString() ?? '', net: plan?.net_cost?.toString() ?? '',
    perkw: plan?.per_kw_price?.toString() ?? '', sort: plan?.sort?.toString() ?? '99',
  });
  const [msg, setMsg] = useState('');
  const n = (s: string) => (s.trim() === '' ? null : Number(s));
  async function save() {
    const r = await savePlan({ id: plan?.id, brand_id: brandId, category: p.category as 'on-grid' | 'hybrid', title: p.title, details: p.details, total_cost: n(p.total), subsidy: n(p.subsidy) ?? 0, net_cost: n(p.net), per_kw_price: n(p.perkw), sort: Number(p.sort) || 0 });
    setMsg(r.ok ? '✓' : r.error || 'Failed');
    if (r.ok && !plan) setP({ ...p, title: '', details: '', total: '', subsidy: '', net: '', perkw: '' });
    router.refresh();
  }
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setP({ ...p, [k]: e.target.value });
  return (
    <div className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="grid grid-cols-[110px_1fr] gap-2">
        <select className="input" value={p.category} onChange={set('category')}><option value="on-grid">On-Grid</option><option value="hybrid">Hybrid</option></select>
        <input className="input" placeholder={tx('Title e.g. 3 kW Hybrid', 'शीर्षक जैसे 3 kW Hybrid')} value={p.title} onChange={set('title')} />
      </div>
      <input className="input" placeholder={tx('Materials / details (inverter, battery…)', 'सामग्री / विवरण (इन्वर्टर, बैटरी…)')} value={p.details} onChange={set('details')} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input className="input" inputMode="numeric" placeholder={tx('Total ₹', 'कुल ₹')} value={p.total} onChange={set('total')} />
        <input className="input" inputMode="numeric" placeholder={tx('Subsidy ₹', 'सब्सिडी ₹')} value={p.subsidy} onChange={set('subsidy')} />
        <input className="input" inputMode="numeric" placeholder={tx('Customer pays ₹', 'ग्राहक देगा ₹')} value={p.net} onChange={set('net')} />
        <input className="input" inputMode="numeric" placeholder={tx('Per-kW price ₹', 'प्रति-kW कीमत ₹')} value={p.perkw} onChange={set('perkw')} />
      </div>
      <div className="flex items-center gap-2">
        <input className="input !w-20" inputMode="numeric" title="Order" value={p.sort} onChange={set('sort')} />
        <button className="btn flex-1" onClick={save}>{plan ? tx('Save', 'सेव') : tx('Add plan', 'प्लान जोड़ें')}</button>
        {plan && <button className="btn-outline !text-brand-red" onClick={async () => { if (confirm(tx('Delete this plan?', 'यह प्लान हटाएँ?'))) { await deletePlan(plan.id); router.refresh(); } }}>{tx('Delete', 'हटाएँ')}</button>}
        {msg && <span className="text-xs font-bold">{msg}</span>}
      </div>
      {!plan && <p className="text-xs text-slate-500">{tx('Leave “customer pays” blank to auto-calculate total − subsidy.', '“ग्राहक देगा” खाली छोड़ें तो कुल − सब्सिडी अपने-आप बनेगा।')}</p>}
    </div>
  );
}

function BrandCard({ brand, plans }: { brand: Brand; plans: Plan[] }) {
  const { tx } = useApp();
  const router = useRouter();
  const [b, setB] = useState({ name: brand.name, tag: brand.tag ?? '', note: brand.note ?? '', coming: brand.coming_soon });
  const [open, setOpen] = useState(false); const [msg, setMsg] = useState('');
  return (
    <div className="rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800">{brand.image_url && <img src={brand.image_url} alt="" className="h-full w-full object-cover" />}</div>
        <div className="min-w-0 flex-1"><p className="truncate font-extrabold">{brand.name}</p><p className="truncate text-xs text-slate-500">{brand.tag} · {plans.length} {tx('plans', 'प्लान')}</p></div>
        <button className="btn-outline" onClick={() => setOpen((o) => !o)}>{open ? tx('Close', 'बंद') : tx('Edit', 'एडिट')}</button>
      </div>
      {open && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" value={b.name} onChange={(e) => setB({ ...b, name: e.target.value })} placeholder={tx('Brand name', 'ब्रांड नाम')} />
            <input className="input" value={b.tag} onChange={(e) => setB({ ...b, tag: e.target.value })} placeholder={tx('Tag e.g. Smart Value', 'टैग जैसे Smart Value')} />
          </div>
          <input className="input" value={b.note} onChange={(e) => setB({ ...b, note: e.target.value })} placeholder={tx('Note shown above plans (optional)', 'प्लान के ऊपर दिखने वाला नोट (वैकल्पिक)')} />
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-5 w-5 accent-brand-blue" checked={b.coming} onChange={(e) => setB({ ...b, coming: e.target.checked })} /> {tx('Coming soon (not clickable)', 'जल्द आ रहा है (क्लिक नहीं होगा)')}</label>
          <div className="flex gap-2">
            <button className="btn flex-1" onClick={async () => { await saveBrand({ id: brand.id, name: b.name, tag: b.tag, note: b.note, coming_soon: b.coming }); setMsg('✓'); router.refresh(); }}>{tx('Save brand', 'ब्रांड सेव करें')} {msg}</button>
            <label className="btn-outline cursor-pointer">{tx('Brand image', 'ब्रांड इमेज')}
              <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; const r = await setBrandImage(brand.id, await imgForm(f)); setMsg(r.ok ? '✓' : r.error || ''); router.refresh(); e.target.value = ''; }} />
            </label>
            <button className="btn-outline !text-brand-red" onClick={async () => { if (confirm(tx('Delete brand and all its plans?', 'ब्रांड और उसके सभी प्लान हटाएँ?'))) { await deleteBrand(brand.id); router.refresh(); } }}>🗑</button>
          </div>
          <p className="pt-2 font-bold">{tx('Plans', 'प्लान')}</p>
          <div className="space-y-2">{plans.map((p) => <PlanRow key={p.id} plan={p} brandId={brand.id} />)}</div>
          <p className="pt-2 font-bold">{tx('Add a new plan', 'नया प्लान जोड़ें')}</p>
          <PlanRow brandId={brand.id} />
        </div>
      )}
    </div>
  );
}

export function PlansEditor({ brands, plans }: { brands: Brand[]; plans: Plan[] }) {
  const { tx } = useApp();
  const router = useRouter();
  const [name, setName] = useState(''); const [tag, setTag] = useState('');
  return (
    <Section title={tx('Plans & brands', 'प्लान और ब्रांड')}>
      <div className="space-y-3">{brands.map((b) => <BrandCard key={b.id} brand={b} plans={plans.filter((p) => p.brand_id === b.id)} />)}</div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input className="input" placeholder={tx('New brand name', 'नया ब्रांड नाम')} value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder={tx('Tag', 'टैग')} value={tag} onChange={(e) => setTag(e.target.value)} />
        <button className="btn" onClick={async () => { const r = await addBrand(name, tag); if (r.ok) { setName(''); setTag(''); router.refresh(); } }}>＋ {tx('Add brand', 'ब्रांड जोड़ें')}</button>
      </div>
    </Section>
  );
}
