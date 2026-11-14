'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { addNotInterested, updateNotInterested } from '@/app/actions';
import { useApp } from './Providers';

type C = { id: string; name: string; mobile: string; reason: string | null; callback_at: string | null };

// ISO time -> value for <input type="datetime-local"> in the owner's own time zone
function toLocalInput(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function Fields({ f, set }: { f: { name: string; mobile: string; reason: string; callback: string }; set: (v: { name: string; mobile: string; reason: string; callback: string }) => void }) {
  const { tx } = useApp();
  return (
    <div className="space-y-3">
      <div><label className="label">{tx('Name of customer', 'ग्राहक का नाम')}</label><input className="input" value={f.name} onChange={(e) => set({ ...f, name: e.target.value })} /></div>
      <div><label className="label">{tx('Mobile number', 'मोबाइल नंबर')}</label><input className="input" inputMode="numeric" maxLength={10} value={f.mobile} onChange={(e) => set({ ...f, mobile: e.target.value.replace(/\D/g, '') })} /></div>
      <div><label className="label">{tx('Reason', 'कारण')}</label><textarea className="input" rows={3} value={f.reason} onChange={(e) => set({ ...f, reason: e.target.value })} /></div>
      <div><label className="label">{tx('Call again on', 'दोबारा कॉल का समय')}</label><input type="datetime-local" className="input" value={f.callback} onChange={(e) => set({ ...f, callback: e.target.value })} /></div>
    </div>
  );
}

/** "＋ Add customer" button on the Not-interested page. */
export function AddNotInterested() {
  const { tx } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', mobile: '', reason: '', callback: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setErr('');
    const r = await addNotInterested(f.name, f.mobile, f.reason, f.callback ? new Date(f.callback).toISOString() : '');
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'Failed'); return; }
    setF({ name: '', mobile: '', reason: '', callback: '' }); setOpen(false); router.refresh();
  }
  return (
    <>
      <button type="button" className="btn !px-3" onClick={() => setOpen(true)}>＋ {tx('Add customer', 'ग्राहक जोड़ें')}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="card max-h-[90vh] w-full max-w-md overflow-auto">
            <h2 className="mb-3 text-lg font-extrabold">{tx('Add not-interested customer', 'अनिच्छुक ग्राहक जोड़ें')}</h2>
            <Fields f={f} set={setF} />
            {err && <p className="mt-2 text-sm font-semibold text-brand-red">{err}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-outline flex-1" onClick={() => setOpen(false)}>{tx('Cancel', 'रद्द')}</button>
              <button type="button" className="btn flex-1" onClick={save} disabled={busy}>{tx('Save', 'सेव')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** "Edit" button inside a not-interested customer's details. */
export function EditNotInterested({ c }: { c: C }) {
  const { tx } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: c.name, mobile: c.mobile, reason: c.reason ?? '', callback: toLocalInput(c.callback_at) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setErr('');
    const r = await updateNotInterested(c.id, f.name, f.mobile, f.reason, f.callback ? new Date(f.callback).toISOString() : '');
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'Failed'); return; }
    setOpen(false); router.refresh();
  }
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="rounded-xl border border-brand-blue px-4 py-2 text-sm font-bold text-brand-blue">✏️ {tx('Edit', 'एडिट')}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="card max-h-[90vh] w-full max-w-md overflow-auto">
            <h2 className="mb-3 text-lg font-extrabold">{tx('Edit details', 'विवरण बदलें')}</h2>
            <Fields f={f} set={setF} />
            {err && <p className="mt-2 text-sm font-semibold text-brand-red">{err}</p>}
            <div className="mt-4 flex gap-2">
              <button type="button" className="btn-outline flex-1" onClick={() => setOpen(false)}>{tx('Cancel', 'रद्द')}</button>
              <button type="button" className="btn flex-1" onClick={save} disabled={busy}>{tx('Save', 'सेव')}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}