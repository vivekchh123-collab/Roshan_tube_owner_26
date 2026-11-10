'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneIcon } from './Icons';
import { useApp } from './Providers';
import { saveCustomer, deleteCustomer } from '@/app/actions';
import { INSTALL_CHECKS, REG_CHECKS, progress, Checklist, Product } from '@/lib/progress';

type C = { id: string; name: string; mobile: string; location: string | null; checklist: Checklist | null; products: Product[] | null };

const CopyIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
const TrashIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>);

export default function CustomerDetail({ c }: { c: C }) {
  const { tx } = useApp();
  const router = useRouter();
  const [checks, setChecks] = useState<Checklist>(c.checklist ?? {});
  const [products, setProducts] = useState<Product[]>(c.products ?? []);
  const [pName, setPName] = useState('');
  const [pSerial, setPSerial] = useState('');
  const [copied, setCopied] = useState('');
  const [msg, setMsg] = useState('');

  const { pct } = progress(checks, products);

  async function persist(nc: Checklist, np: Product[]) {
    const r = await saveCustomer(c.id, nc, np);
    if (!r.ok) { setMsg(r.error || 'Save failed'); return; }
    setProducts(r.products as Product[]);
    if (r.status === 'completed') router.push('/completed');
    else router.refresh();
  }
  function toggle(k: string) {
    const nc = { ...checks, [k]: !checks[k] };
    setChecks(nc);
    persist(nc, products);
  }
  function addProduct() {
    if (!pName.trim() && !pSerial.trim()) return;
    const np = [...products, { id: crypto.randomUUID(), name: pName, serial: pSerial }];
    setProducts(np); setPName(''); setPSerial('');
    persist(checks, np);
  }
  function removeProduct(id: string) {
    const np = products.filter((p) => p.id !== id);
    setProducts(np);
    persist(checks, np);
  }
  async function copy(s: string) {
    try { await navigator.clipboard.writeText(s); setCopied(s); setTimeout(() => setCopied(''), 1500); } catch {}
  }

  const Tick = ({ k, en, hi }: { k: string; en: string; hi: string }) => (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <input type="checkbox" className="h-5 w-5 accent-brand-blue" checked={!!checks[k]} onChange={() => toggle(k)} />
      <span className="font-semibold">{tx(en, hi)}</span>
    </label>
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-extrabold text-brand-navy dark:text-white">{c.name}</h1>
          <p className="text-slate-500">{c.mobile}</p>
          {c.location && <p className="truncate text-xs text-slate-400">📍 {c.location}</p>}
        </div>
        <a href={`tel:+91${c.mobile}`} aria-label="Call" className="rounded-full bg-green-600 p-3 text-white"><PhoneIcon width={22} height={22} /></a>
      </div>

      <div className="card mt-4">
        <div className="flex items-center justify-between text-sm font-bold"><span>{tx('Completion', 'पूर्णता')}</span><span>{pct}%</span></div>
        <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-brand-blue transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="mt-2 text-xs text-slate-500">{tx('At 100% this customer moves to “Customer completed work” automatically.', '100% होने पर ग्राहक अपने-आप “ग्राहक का पूरा काम” में चला जाता है।')}</p>
      </div>

      <h2 className="mt-6 text-lg font-extrabold">{tx('Registration', 'रजिस्ट्रेशन')}</h2>
      <div className="mt-2 space-y-2">{REG_CHECKS.map(([k, en, hi]) => <Tick key={k} k={k} en={en} hi={hi} />)}</div>

      <h2 className="mt-6 text-lg font-extrabold">{tx('Installation', 'इंस्टॉलेशन')}</h2>
      <div className="card mt-2 space-y-3">
        <p className="font-bold">{tx('Product serial numbers', 'प्रोडक्ट सीरियल नंबर')}</p>
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input className="input" placeholder={tx('Product name', 'प्रोडक्ट का नाम')} value={pName} onChange={(e) => setPName(e.target.value)} />
          <input className="input" placeholder={tx('Serial no.', 'सीरियल नं.')} value={pSerial} onChange={(e) => setPSerial(e.target.value)} />
          <button className="btn" onClick={addProduct}>＋</button>
        </div>
        <ul className="space-y-2">
          {products.map((p) => (
            <li key={p.id} className="flex items-center gap-2 rounded-xl bg-slate-100 p-2 dark:bg-slate-800">
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{p.name}</p><p className="truncate font-mono text-sm">{p.serial}</p></div>
              <button onClick={() => copy(p.serial)} aria-label="Copy serial" className="rounded-lg p-2 hover:bg-slate-200 dark:hover:bg-slate-700">{copied === p.serial ? '✓' : <CopyIcon />}</button>
              <button onClick={() => removeProduct(p.id)} aria-label="Delete" className="rounded-lg p-2 text-brand-red hover:bg-slate-200 dark:hover:bg-slate-700"><TrashIcon /></button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-2 space-y-2">{INSTALL_CHECKS.map(([k, en, hi]) => <Tick key={k} k={k} en={en} hi={hi} />)}</div>

      {msg && <p className="mt-3 text-sm font-semibold text-brand-red">{msg}</p>}
      <button
        className="btn-outline mt-8 w-full !text-brand-red"
        onClick={async () => { if (confirm(tx('Delete this customer permanently?', 'इस ग्राहक को हमेशा के लिए हटाएँ?'))) { await deleteCustomer(c.id); router.push('/'); } }}
      >
        {tx('Delete customer', 'ग्राहक हटाएँ')}
      </button>
    </div>
  );
}
