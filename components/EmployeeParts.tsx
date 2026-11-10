'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhoneIcon } from './Icons';
import { useApp } from './Providers';
import { addEmployee, approveEmployee, removeEmployee, updateEmployee } from '@/app/actions';

export type Emp = { id: string; name: string; mobile: string | null; email: string | null; status: string; allowed: boolean };

export function AddEmployee() {
  const { tx } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: '', mobile: '', email: '' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setMsg('');
    const r = await addEmployee(f.name, f.mobile, f.email);
    setBusy(false);
    if (!r.ok) { setMsg(r.error || 'Failed'); return; }
    setMsg(r.note || 'Added'); setF({ name: '', mobile: '', email: '' }); router.refresh();
  }
  return (
    <div>
      <button className="btn" onClick={() => setOpen((o) => !o)}>＋ {tx('Allow a new employee', 'नया कर्मचारी अनुमत करें')}</button>
      {open && (
        <div className="card mt-3 space-y-3">
          <p className="text-xs text-slate-500">{tx('Only emails added here can log in to the Customer Detail page of the public website.', 'केवल यहाँ जोड़े गए ईमेल ही पब्लिक वेबसाइट के ग्राहक विवरण पेज में लॉगिन कर सकते हैं।')}</p>
          <input className="input" placeholder={tx('Name', 'नाम')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          <input className="input" inputMode="numeric" maxLength={10} placeholder={tx('Mobile (WhatsApp)', 'मोबाइल (WhatsApp)')} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value.replace(/\D/g, '') })} />
          <input className="input" type="email" placeholder="Email (Gmail)" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          {msg && <p className="text-sm font-semibold text-brand-blue">{msg}</p>}
          <button className="btn w-full" onClick={save} disabled={busy}>{tx('Allow & send invite', 'अनुमति दें और इन्वाइट भेजें')}</button>
        </div>
      )}
    </div>
  );
}

export function EmployeeRow({ e }: { e: Emp }) {
  const { tx } = useApp();
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [name, setName] = useState(e.name);
  const [mobile, setMobile] = useState(e.mobile ?? '');
  const [err, setErr] = useState('');

  async function save() {
    const r = await updateEmployee(e.id, name, mobile);
    if (!r.ok) { setErr(r.error || 'Failed'); return; }
    setEdit(false); router.refresh();
  }
  async function del() {
    if (!confirm(tx(`Remove ${e.name}? They will lose access.`, `${e.name} को हटाएँ? उनकी पहुँच बंद हो जाएगी।`))) return;
    await removeEmployee(e.id); router.refresh();
  }

  if (edit) {
    return (
      <li className="card space-y-2 !p-3">
        <input className="input" value={name} onChange={(x) => setName(x.target.value)} />
        <input className="input" inputMode="numeric" maxLength={10} value={mobile} onChange={(x) => setMobile(x.target.value.replace(/\D/g, ''))} />
        {err && <p className="text-sm text-brand-red">{err}</p>}
        <div className="flex gap-2"><button className="btn-outline flex-1" onClick={() => setEdit(false)}>{tx('Cancel', 'रद्द')}</button><button className="btn flex-1" onClick={save}>{tx('Save', 'सेव')}</button></div>
      </li>
    );
  }
  return (
    <li className="card flex items-center gap-2 !p-3">
      <Link href={`/employees/${e.id}`} className="min-w-0 flex-1">
        <p className="truncate font-bold">{e.name}</p>
        <p className="truncate text-xs text-slate-500">{e.mobile} · {e.email}</p>
      </Link>
      {e.mobile && <a href={`tel:+91${e.mobile}`} aria-label="Call" className="rounded-full bg-green-600 p-2.5 text-white"><PhoneIcon width={18} height={18} /></a>}
      <button onClick={() => setEdit(true)} className="rounded-lg px-2 py-1 text-sm font-bold text-brand-blue">{tx('Edit', 'एडिट')}</button>
      <button onClick={del} className="rounded-lg px-2 py-1 text-sm font-bold text-brand-red">{tx('Delete', 'हटाएँ')}</button>
    </li>
  );
}

export function ApplicantRow({ e }: { e: Emp }) {
  const { tx } = useApp();
  const router = useRouter();
  const [note, setNote] = useState('');
  return (
    <li className="card !p-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1"><p className="truncate font-bold">{e.name}</p><p className="truncate text-xs text-slate-500">{e.mobile} · {e.email}</p></div>
        {e.mobile && <a href={`tel:+91${e.mobile}`} aria-label="Call" className="rounded-full bg-green-600 p-2.5 text-white"><PhoneIcon width={18} height={18} /></a>}
      </div>
      <div className="mt-2 flex gap-2">
        <button className="btn flex-1" onClick={async () => { const r = await approveEmployee(e.id); setNote(r.note || ''); router.refresh(); }}>{tx('Approve & allow login', 'मंज़ूर करें और लॉगिन दें')}</button>
        <button className="btn-outline flex-1 !text-brand-red" onClick={async () => { await removeEmployee(e.id); router.refresh(); }}>{tx('Reject', 'अस्वीकार')}</button>
      </div>
      {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
    </li>
  );
}
