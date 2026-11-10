import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { PhoneIcon } from '@/components/Icons';
import T from '@/components/T';

export const dynamic = 'force-dynamic';

const ist = (d: string | Date) => new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD

export default async function EmployeeActivity({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const sb = db();
  const { data: emp } = await sb.from('employees').select('id,name,mobile').eq('id', id).maybeSingle();
  if (!emp) notFound();
  const { data } = await sb.from('customers').select('id,name,mobile,status,created_at').eq('employee_id', id).order('created_at', { ascending: false });
  const rows = data ?? [];

  const today = ist(new Date());
  const days = Array.from({ length: 7 }, (_, i) => ist(new Date(Date.now() - i * 86400000)));
  const perDay = days.map((d) => ({ d, n: rows.filter((r) => ist(r.created_at) === d).length }));
  const todayN = perDay[0].n;
  const weekN = perDay.reduce((s, x) => s + x.n, 0);
  const max = Math.max(1, ...perDay.map((x) => x.n));
  const label: Record<string, [string, string]> = { pending: ['Interested', 'इच्छुक'], completed: ['Completed', 'पूरा'], not_interested: ['Not interested', 'अनिच्छुक'] };

  return (
    <>
      <Link href="/employees" className="text-sm font-semibold text-brand-blue">← <T en="Employees" hi="कर्मचारी" /></Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">{emp.name}</h1>
        {emp.mobile && <a href={`tel:+91${emp.mobile}`} className="rounded-full bg-green-600 p-3 text-white" aria-label="Call"><PhoneIcon width={20} height={20} /></a>}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[[todayN, 'Today', 'आज'], [weekN, 'Last 7 days', 'पिछले 7 दिन'], [rows.length, 'Overall', 'कुल']].map(([n, en, hi]) => (
          <div key={String(en)} className="card !p-3"><p className="text-2xl font-extrabold text-brand-blue">{n}</p><p className="text-xs text-slate-500"><T en={String(en)} hi={String(hi)} /></p></div>
        ))}
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-bold"><T en="Customers connected per day" hi="प्रतिदिन जुड़े ग्राहक" /></p>
        {perDay.map((x) => (
          <div key={x.d} className="flex items-center gap-2 py-1 text-xs">
            <span className="w-20 shrink-0 text-slate-500">{x.d === today ? 'Today' : x.d.slice(5)}</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-brand-blue" style={{ width: `${(x.n / max) * 100}%` }} /></div>
            <span className="w-5 text-right font-bold">{x.n}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-extrabold"><T en="Customers" hi="ग्राहक" /></h2>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card flex items-center gap-3 !p-3">
            <div className="min-w-0 flex-1"><p className="truncate font-bold">{r.name}</p><p className="text-xs text-slate-500">{r.mobile} · {new Date(r.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })}</p></div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800"><T en={label[r.status]?.[0] ?? r.status} hi={label[r.status]?.[1] ?? r.status} /></span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && <p className="py-6 text-center text-slate-500"><T en="No customers connected yet." hi="अभी कोई ग्राहक नहीं जुड़ा।" /></p>}
    </>
  );
}
