import Link from 'next/link';
import { PhoneIcon } from './Icons';
import { progress } from '@/lib/progress';
import T from './T';

type Row = { id: string; name: string; mobile: string; checklist: Record<string, boolean> | null; products: { id: string }[] | null };

/** Pending / completed list: name, mobile, call button. Tap a row to open the checklist. */
export default function CustomerList({ rows, showProgress = true, empty }: { rows: Row[]; showProgress?: boolean; empty: [string, string] }) {
  if (rows.length === 0) return <p className="py-10 text-center text-slate-500"><T en={empty[0]} hi={empty[1]} /></p>;
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const { pct } = progress(r.checklist, r.products as never);
        return (
          <li key={r.id} className="card flex items-center gap-3 !p-3">
            <Link href={`/customer/${r.id}`} className="min-w-0 flex-1">
              <p className="truncate font-bold">{r.name}</p>
              <p className="text-sm text-slate-500">{r.mobile}</p>
              {showProgress && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><div className="h-full bg-brand-blue" style={{ width: `${pct}%` }} /></div>
                  <span className="w-10 text-right text-xs font-bold">{pct}%</span>
                </div>
              )}
            </Link>
            <a href={`tel:+91${r.mobile}`} aria-label={`Call ${r.name}`} className="rounded-full bg-green-600 p-3 text-white"><PhoneIcon width={20} height={20} /></a>
          </li>
        );
      })}
    </ul>
  );
}
