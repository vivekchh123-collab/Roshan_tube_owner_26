import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { cleanQuery, orFilter } from "@/lib/search";
import { PhoneIcon } from "@/components/Icons";
import SearchBar from "@/components/SearchBar";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function NotInterested({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOwner();
  const q = cleanQuery((await searchParams).q);

  let query = db()
    .from("customers")
    .select("id,name,mobile,reason,callback_at,employee_name,created_at")
    .eq("status", "not_interested")
    .order("callback_at", { ascending: true });
  if (q) query = query.or(orFilter(q));
  const { data } = await query;

  const rows = data ?? [];
  const fmt = (s: string | null) =>
    s
      ? new Date(s).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          <T en="Customer not interested" hi="अनिच्छुक ग्राहक" />
        </h1>
        <SearchBar q={q} />
      </div>
      <p className="mb-4 text-sm text-slate-500">
        <T
          en="Tap a customer to see the reason and when to call again."
          hi="कारण और दोबारा कॉल का समय देखने के लिए ग्राहक पर टैप करें।"
        />
      </p>
      {rows.length === 0 && (
        <p className="py-10 text-center text-slate-500">
          {q ? (
            <T
              en="No customer found for this search."
              hi="इस खोज के लिए कोई ग्राहक नहीं मिला।"
            />
          ) : (
            <T en="No customers here." hi="यहाँ कोई ग्राहक नहीं है।" />
          )}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card !p-0">
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{r.name}</p>
                  <p className="text-sm text-slate-500">{r.mobile}</p>
                </div>
                <a
                  href={`tel:+91${r.mobile}`}
                  aria-label={`Call ${r.name}`}
                  className="rounded-full bg-green-600 p-3 text-white"
                >
                  <PhoneIcon width={20} height={20} />
                </a>
              </summary>
              <div className="space-y-1 border-t border-slate-200 p-3 text-sm dark:border-slate-800">
                <p>
                  <b>
                    <T en="Reason:" hi="कारण:" />
                  </b>{" "}
                  {r.reason || "—"}
                </p>
                <p>
                  <b>
                    <T en="Call again on:" hi="दोबारा कॉल का समय:" />
                  </b>{" "}
                  {fmt(r.callback_at)}
                </p>
                {r.employee_name && (
                  <p className="text-slate-500">
                    <T en="Contacted by" hi="संपर्क किया" /> {r.employee_name}
                  </p>
                )}
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
