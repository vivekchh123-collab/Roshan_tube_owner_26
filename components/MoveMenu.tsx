'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { moveCustomer } from '@/app/actions';
import { useApp } from './Providers';

type St = 'pending' | 'interested' | 'not_interested';
const LABEL: Record<St, [string, string]> = {
  pending: ['Pending work', 'पेंडिंग काम'],
  interested: ['Customer interested', 'इच्छुक ग्राहक'],
  not_interested: ['Customer not interested', 'अनिच्छुक ग्राहक'],
};

/** ▾ dropdown icon on every customer row. Opens a sheet: "Move to ..." (the other two lists). */
export default function MoveMenu({ id, name, from }: { id: string; name: string; from: St }) {
  const { tx } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [askReason, setAskReason] = useState(false);
  const [reason, setReason] = useState('');
  const [callback, setCallback] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const targets = (Object.keys(LABEL) as St[]).filter((s) => s !== from);

  function close() { setOpen(false); setAskReason(false); setReason(''); setCallback(''); setErr(''); }

  async function go(to: St) {
    if (to === 'not_interested' && !askReason) { setAskReason(true); return; }
    setBusy(true); setErr('');
    const r = await moveCustomer(id, to, reason, callback ? new Date(callback).toISOString() : '');
    setBusy(false);
    if (!r.ok) { setErr(r.error || 'Failed'); return; }
    close();
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tx('Move customer', 'ग्राहक को दूसरी सूची में भेजें')}
        title={tx('Move to another list', 'दूसरी सूची में भेजें')}
        className="rounded-full border border-slate-300 p-2.5 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={close}>
          <div className="card w-full max-w-sm space-y-2" onClick={(e) => e.stopPropagation()}>
            <p className="text-lg font-extrabold">{tx('Move', 'भेजें')}: {name}</p>
            {!askReason ? (
              <>
                <p className="text-sm text-slate-500">{tx('Move this customer to:', 'इस ग्राहक को यहाँ भेजें:')}</p>
                {targets.map((t) => (
                  <button key={t} type="button" disabled={busy} onClick={() => go(t)} className="btn-outline w-full !justify-start">
                    ➜ {tx(LABEL[t][0], LABEL[t][1])}
                  </button>
                ))}
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500">{tx('Not interested – enter the reason and when to call again.', 'अनिच्छुक – कारण और दोबारा कॉल का समय लिखें।')}</p>
                <div><label className="label">{tx('Reason', 'कारण')}</label><textarea className="input" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus /></div>
                <div><label className="label">{tx('Call again on', 'दोबारा कॉल का समय')}</label><input type="datetime-local" className="input" value={callback} onChange={(e) => setCallback(e.target.value)} /></div>
                <button type="button" className="btn w-full" disabled={busy} onClick={() => go('not_interested')}>{tx('Move to not interested', 'अनिच्छुक में भेजें')}</button>
              </>
            )}
            {err && <p className="text-sm font-semibold text-brand-red">{err}</p>}
            <button type="button" className="btn-outline w-full" onClick={close}>{tx('Cancel', 'रद्द करें')}</button>
          </div>
        </div>
      )}
    </>
  );
}
