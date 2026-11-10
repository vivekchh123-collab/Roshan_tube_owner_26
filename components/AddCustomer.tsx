'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addCustomer } from '@/app/actions';
import { useApp } from './Providers';

export default function AddCustomer() {
  const { tx } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setErr('');
    const r = await addCustomer(name, mobile);
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'Failed'); return; }
    setOpen(false); setName(''); setMobile('');
    router.refresh();
  }

  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>＋ {tx('Add customer detail', 'ग्राहक विवरण जोड़ें')}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="card w-full max-w-md space-y-3">
            <p className="text-lg font-extrabold">{tx('Add customer detail', 'ग्राहक विवरण जोड़ें')}</p>
            <div><label className="label">{tx('Name of customer', 'ग्राहक का नाम')}</label><input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></div>
            <div><label className="label">{tx('Mobile number', 'मोबाइल नंबर')}</label><input className="input" inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))} /></div>
            {err && <p className="text-sm font-semibold text-brand-red">{err}</p>}
            <div className="flex gap-2">
              <button className="btn-outline flex-1" onClick={() => setOpen(false)}>{tx('Cancel', 'रद्द करें')}</button>
              <button className="btn flex-1" onClick={save} disabled={busy}>{tx('Save', 'सेव करें')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
