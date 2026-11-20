import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { cleanQuery, cleanSort, orFilter } from "@/lib/search";
import { PhoneIcon } from "@/components/Icons";
import AddCustomer from "@/components/AddCustomer";
import SearchBar from "@/components/SearchBar";
import SortFilter from "@/components/SortFilter";
import MoveMenu from "@/components/MoveMenu";
import DeleteCustomerButton from "@/components/DeleteCustomerButton";
import { EditInterested } from "@/components/InterestedParts";
import T from "@/components/T";
import MarkSeen from "@/components/MarkSeen";

export const dynamic = "force-dynamic";

export default async function Interested({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  await requireOwner();
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const sort = cleanSort(sp.sort, ["new", "old"], "new");

  let query = db()
    .from("customers")
    .select("id,name,mobile,location,lat,lng,employee_name,created_at")
    .eq("status", "interested")
    .order("created_at", { ascending: sort === "old" });
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
      <MarkSeen k="interested" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          <T en="Customer interested" hi="इच्छुक ग्राहक" />
        </h1>
        <div className="flex items-center gap-2">
          <AddCustomer status="interested" />
          <SearchBar q={q} />
        </div>
      </div>
      <div className="mt-3">
        <SortFilter sort={sort} options={["new", "old"]} />
      </div>
      <p className="mb-4 mt-3 text-sm text-slate-500">
        <T
          en="Tap a customer to see all details. Use the ▾ icon to move one to Pending work when the work starts."
          hi="सारा विवरण देखने के लिए ग्राहक पर टैप करें। काम शुरू होने पर ▾ आइकन से उसे पेंडिंग काम में भेजें।"
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
            <T
              en="No interested customers yet."
              hi="अभी कोई इच्छुक ग्राहक नहीं है।"
            />
          )}
        </p>
      )}
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card relative !p-0">
            <div className="absolute right-[4.25rem] top-4 z-10">
              <MoveMenu id={r.id} name={r.name} from="interested" />
            </div>
            <details>
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                <div className="min-w-0 flex-1 pr-12">
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
                    <T en="Name:" hi="नाम:" />
                  </b>{" "}
                  {r.name}
                </p>
                <p>
                  <b>
                    <T en="Mobile:" hi="मोबाइल:" />
                  </b>{" "}
                  {r.mobile}
                </p>
                <p>
                  <b>
                    <T en="Location:" hi="लोकेशन:" />
                  </b>{" "}
                  {r.location || "—"}
                </p>
                {r.lat != null && r.lng != null && (
                  <p>
                    <a
                      className="font-semibold text-brand-blue underline"
                      href={`https://maps.google.com/?q=${r.lat},${r.lng}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      📍 <T en="Open on map" hi="नक्शे पर खोलें" />
                    </a>
                  </p>
                )}
                <p>
                  <b>
                    <T en="Added on:" hi="जोड़ा गया:" />
                  </b>{" "}
                  {fmt(r.created_at)}
                </p>
                {r.employee_name && (
                  <p className="text-slate-500">
                    <T en="Contacted by" hi="संपर्क किया" /> {r.employee_name}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <EditInterested
                    c={{
                      id: r.id,
                      name: r.name,
                      mobile: r.mobile,
                      location: r.location,
                    }}
                  />
                  <DeleteCustomerButton id={r.id} name={r.name} />
                </div>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </>
  );
}
