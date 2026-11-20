import Link from "next/link";
import { PhoneIcon } from "./Icons";
import { progress } from "@/lib/progress";
import MoveMenu from "./MoveMenu";
import T from "./T";

type Row = {
  id: string;
  name: string;
  mobile: string;
  checklist?: Record<string, boolean> | null;
  products?: { id: string }[] | null;
  employee_name?: string | null;
  created_at?: string | null;
};

/**
 * Customer list used by Pending work and Customer completed work (and plain rows for interested).
 * - pending / completed: tap a row to open the checklist
 * - pending / interested rows also get the ▾ "move to another list" icon
 */
export default function CustomerList({
  rows,
  status,
  showProgress = true,
  empty,
}: {
  rows: Row[];
  status: "pending" | "interested" | "completed";
  showProgress?: boolean;
  empty: [string, string];
}) {
  if (rows.length === 0)
    return (
      <p className="py-10 text-center text-slate-500">
        <T en={empty[0]} hi={empty[1]} />
      </p>
    );
  const when = (s?: string | null) =>
    s
      ? new Date(s).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";
  return (
    <ul className="space-y-2">
      {rows.map((r) => {
        const { pct } = progress(r.checklist, r.products as never);
        const body = (
          <>
            <p className="truncate font-bold">{r.name}</p>
            <p className="text-sm text-slate-500">{r.mobile}</p>
            {status === "interested" && (r.employee_name || r.created_at) && (
              <p className="mt-0.5 text-xs text-slate-500">
                {r.employee_name ? (
                  <>
                    <T en="By" hi="द्वारा" /> {r.employee_name} ·{" "}
                  </>
                ) : null}
                {when(r.created_at)}
              </p>
            )}
            {showProgress && status !== "interested" && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full bg-brand-blue"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-bold">
                  {pct}%
                </span>
              </div>
            )}
          </>
        );
        return (
          <li key={r.id} className="card flex items-center gap-2 !p-3">
            {status === "interested" ? (
              <div className="min-w-0 flex-1">{body}</div>
            ) : (
              <Link href={`/customer/${r.id}`} className="min-w-0 flex-1">
                {body}
              </Link>
            )}
            {status !== "completed" && (
              <MoveMenu id={r.id} name={r.name} from={status} />
            )}
            <a
              href={`tel:+91${r.mobile}`}
              aria-label={`Call ${r.name}`}
              className="rounded-full bg-green-600 p-3 text-white"
            >
              <PhoneIcon width={20} height={20} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
