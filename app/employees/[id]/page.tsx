import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { PhoneIcon } from "@/components/Icons";
import T from "@/components/T";

export const dynamic = "force-dynamic";

const ist = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

const km = (
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
) => {
  const R = 6371,
    r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r,
    dLng = (b.lng - a.lng) * r;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
const ago = (iso: string) => {
  const m = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.floor(m / 60)} h ${m % 60} min ago`;
  return `${Math.floor(m / 1440)} day(s) ago`;
};

export default async function EmployeeActivity({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ day?: string }>;
}) {
  await requireOwner();
  const { id } = await params;
  const dayParam = (await searchParams).day;
  const sb = db();
  const { data: emp } = await sb
    .from("employees")
    .select("id,name,mobile")
    .eq("id", id)
    .maybeSingle();
  if (!emp) notFound();
  const { data } = await sb
    .from("customers")
    .select("id,name,mobile,status,created_at")
    .eq("employee_id", id)
    .order("created_at", { ascending: false });
  const rows = data ?? [];

  const today = ist(new Date());
  const day =
    dayParam && /^\d{4}-\d{2}-\d{2}$/.test(dayParam) ? dayParam : today;

  // ---- live location ----
  const { data: lastLoc } = await sb
    .from("employee_locations")
    .select("lat,lng,accuracy,kind,created_at")
    .eq("employee_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: trailRaw } = await sb
    .from("employee_locations")
    .select("lat,lng,kind,created_at")
    .eq("employee_id", id)
    .gte("created_at", `${day}T00:00:00+05:30`)
    .lte("created_at", `${day}T23:59:59.999+05:30`)
    .order("created_at", { ascending: true })
    .limit(1000);
  const trail = trailRaw ?? [];
  let distKm = 0;
  for (let i = 1; i < trail.length; i++) {
    const d = km(trail[i - 1], trail[i]);
    if (d >= 0.02) distKm += d;
  } // ignore GPS jitter under 20 m
  const sample =
    trail.length > 10
      ? Array.from(
          { length: 10 },
          (_, i) => trail[Math.round((i * (trail.length - 1)) / 9)],
        )
      : trail;
  const routeUrl =
    sample.length >= 2
      ? `https://www.google.com/maps/dir/${sample.map((p) => `${p.lat},${p.lng}`).join("/")}`
      : "";
  const liveMs = lastLoc
    ? Date.now() - new Date(lastLoc.created_at).getTime()
    : Infinity;
  const state: "live" | "stopped" | "lost" | "never" = !lastLoc
    ? "never"
    : lastLoc.kind === "stop"
      ? "stopped"
      : liveMs <= 5 * 60000
        ? "live"
        : "lost";
  const tm = (s: string) =>
    new Date(s).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });
  const days = Array.from({ length: 7 }, (_, i) =>
    ist(new Date(Date.now() - i * 86400000)),
  );
  const perDay = days.map((d) => ({
    d,
    n: rows.filter((r) => ist(r.created_at) === d).length,
  }));
  const todayN = perDay[0].n;
  const weekN = perDay.reduce((s, x) => s + x.n, 0);
  const max = Math.max(1, ...perDay.map((x) => x.n));

  // Interested = pending + completed (both started as "interested"); Not interested = not_interested
  const isInt = (st: string) => st !== "not_interested";
  const inDays = (r: { created_at: string }, set: string[]) =>
    set.includes(ist(r.created_at));
  const split = (list: typeof rows) => ({
    int: list.filter((r) => isInt(r.status)).length,
    not: list.filter((r) => !isInt(r.status)).length,
  });
  const sToday = split(rows.filter((r) => inDays(r, [today])));
  const sWeek = split(rows.filter((r) => inDays(r, days)));
  const sAll = split(rows);
  const doneN = rows.filter((r) => r.status === "completed").length;
  const label: Record<string, [string, string]> = {
    pending: ["Interested (work started)", "इच्छुक (काम शुरू)"],
    interested: ["Interested", "इच्छुक"],
    completed: ["Completed", "पूरा"],
    not_interested: ["Not interested", "अनिच्छुक"],
  };

  return (
    <>
      <Link href="/employees" className="text-sm font-semibold text-brand-blue">
        ← <T en="Employees" hi="कर्मचारी" />
      </Link>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          {emp.name}
        </h1>
        {emp.mobile && (
          <a
            href={`tel:+91${emp.mobile}`}
            className="rounded-full bg-green-600 p-3 text-white"
            aria-label="Call"
          >
            <PhoneIcon width={20} height={20} />
          </a>
        )}
      </div>

      {/* ===== Live location ===== */}
      <div className="card mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-extrabold">
            📍 <T en="Location" hi="लोकेशन" />
          </p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold text-white ${state === "live" ? "bg-green-600" : state === "lost" ? "bg-amber-500" : "bg-slate-500"}`}
          >
            {state === "live" && <T en="● Live" hi="● लाइव" />}
            {state === "lost" && <T en="Last seen" hi="आख़िरी बार देखा" />}
            {state === "stopped" && <T en="Sharing is OFF" hi="शेयरिंग बंद" />}
            {state === "never" && <T en="Never shared" hi="कभी शेयर नहीं की" />}
          </span>
        </div>
        {lastLoc ? (
          <>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <T en="Last update:" hi="आख़िरी अपडेट:" />{" "}
              <b>{ago(lastLoc.created_at)}</b> (
              {new Date(lastLoc.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {lastLoc.accuracy ? `, ±${Math.round(lastLoc.accuracy)} m` : ""})
            </p>
            <iframe
              title="Employee location"
              className="mt-2 h-56 w-full rounded-xl border border-slate-200 dark:border-slate-700"
              loading="lazy"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${lastLoc.lng - 0.004}%2C${lastLoc.lat - 0.003}%2C${lastLoc.lng + 0.004}%2C${lastLoc.lat + 0.003}&layer=mapnik&marker=${lastLoc.lat}%2C${lastLoc.lng}`}
            />
            <a
              className="mt-2 inline-block text-sm font-semibold text-brand-blue underline"
              target="_blank"
              rel="noreferrer"
              href={`https://maps.google.com/?q=${lastLoc.lat},${lastLoc.lng}`}
            >
              <T en="Open in Google Maps" hi="Google Maps में खोलें" />
            </a>
          </>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            <T
              en="This employee has not switched on location sharing yet."
              hi="इस कर्मचारी ने अभी लोकेशन शेयरिंग चालू नहीं की है।"
            />
          </p>
        )}

        <form
          method="get"
          className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-3 dark:border-slate-800"
        >
          <label className="text-sm font-bold">
            <T en="Where did they go on:" hi="किस दिन कहाँ गए:" />
          </label>
          <input
            type="date"
            name="day"
            defaultValue={day}
            max={today}
            className="input !w-auto"
          />
          <button className="btn-outline !px-3 !py-2">{`→`}</button>
        </form>
        {trail.length > 0 ? (
          <div className="mt-2 text-sm">
            <p>
              <b>{trail.length}</b> <T en="points" hi="पॉइंट" /> ·{" "}
              <T en="about" hi="लगभग" /> <b>{distKm.toFixed(1)} km</b>{" "}
              <T en="travelled" hi="चले" /> · {tm(trail[0].created_at)} →{" "}
              {tm(trail[trail.length - 1].created_at)}
            </p>
            {routeUrl && (
              <a
                className="font-semibold text-brand-blue underline"
                target="_blank"
                rel="noreferrer"
                href={routeUrl}
              >
                🗺{" "}
                <T
                  en="Show the route in Google Maps"
                  hi="Google Maps में रूट देखें"
                />
              </a>
            )}
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold">
                <T en="All points of the day" hi="दिन के सभी पॉइंट" />
              </summary>
              <ul className="mt-1 max-h-60 space-y-1 overflow-auto text-xs">
                {trail.map((p, i) => (
                  <li
                    key={i}
                    className="flex justify-between gap-2 border-b border-slate-100 py-1 dark:border-slate-800"
                  >
                    <span>
                      {tm(p.created_at)}
                      {p.kind === "stop" ? " · ⏹ stopped" : ""}
                    </span>
                    <a
                      className="text-brand-blue underline"
                      target="_blank"
                      rel="noreferrer"
                      href={`https://maps.google.com/?q=${p.lat},${p.lng}`}
                    >
                      {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            <T
              en="No location points on this day."
              hi="इस दिन कोई लोकेशन पॉइंट नहीं।"
            />
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          <T
            en="Location is recorded only while the employee has switched sharing ON, and only while the page is open on their phone. Points older than 30 days are removed automatically."
            hi="लोकेशन तभी दर्ज होती है जब कर्मचारी ने शेयरिंग चालू की हो और उनके फोन पर पेज खुला हो। 30 दिन से पुराने पॉइंट अपने-आप हट जाते हैं।"
          />
        </p>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          [todayN, "Today", "आज"],
          [weekN, "Last 7 days", "पिछले 7 दिन"],
          [rows.length, "Overall", "कुल"],
        ].map(([n, en, hi]) => (
          <div key={String(en)} className="card !p-3">
            <p className="text-2xl font-extrabold text-brand-blue">{n}</p>
            <p className="text-xs text-slate-500">
              <T en={String(en)} hi={String(hi)} />
            </p>
          </div>
        ))}
      </div>

      <div className="card mt-4 overflow-hidden !p-0">
        <table className="w-full text-center text-sm">
          <thead className="bg-slate-100 text-xs dark:bg-slate-800">
            <tr>
              <th className="p-2 text-left">
                <T en="Customers" hi="ग्राहक" />
              </th>
              <th>
                <T en="Today" hi="आज" />
              </th>
              <th>
                <T en="Last 7 days" hi="पिछले 7 दिन" />
              </th>
              <th>
                <T en="Overall" hi="कुल" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="p-2 text-left font-bold text-green-600">
                👍 <T en="Interested" hi="इच्छुक" />
              </td>
              <td className="font-extrabold">{sToday.int}</td>
              <td className="font-extrabold">{sWeek.int}</td>
              <td className="font-extrabold">{sAll.int}</td>
            </tr>
            <tr className="border-t border-slate-200 dark:border-slate-800">
              <td className="p-2 text-left font-bold text-brand-red">
                👎 <T en="Not interested" hi="अनिच्छुक" />
              </td>
              <td className="font-extrabold">{sToday.not}</td>
              <td className="font-extrabold">{sWeek.not}</td>
              <td className="font-extrabold">{sAll.not}</td>
            </tr>
          </tbody>
        </table>
        <p className="border-t border-slate-200 p-2 text-xs text-slate-500 dark:border-slate-800">
          <T
            en={`Of the ${sAll.int} interested customers, ${doneN} have completed work.`}
            hi={`${sAll.int} इच्छुक ग्राहकों में से ${doneN} का काम पूरा हो चुका है।`}
          />
        </p>
      </div>

      <div className="card mt-4">
        <p className="mb-2 text-sm font-bold">
          <T en="Customers connected per day" hi="प्रतिदिन जुड़े ग्राहक" />
        </p>
        {perDay.map((x) => (
          <div key={x.d} className="flex items-center gap-2 py-1 text-xs">
            <span className="w-20 shrink-0 text-slate-500">
              {x.d === today ? "Today" : x.d.slice(5)}
            </span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
              <div
                className="h-full bg-brand-blue"
                style={{ width: `${(x.n / max) * 100}%` }}
              />
            </div>
            <span className="w-5 text-right font-bold">{x.n}</span>
          </div>
        ))}
      </div>

      <h2 className="mt-6 text-lg font-extrabold">
        <T en="Customers" hi="ग्राहक" />
      </h2>
      <ul className="mt-2 space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="card flex items-center gap-3 !p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-bold">{r.name}</p>
              <p className="text-xs text-slate-500">
                {r.mobile} ·{" "}
                {new Date(r.created_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">
              <T
                en={label[r.status]?.[0] ?? r.status}
                hi={label[r.status]?.[1] ?? r.status}
              />
            </span>
          </li>
        ))}
      </ul>
      {rows.length === 0 && (
        <p className="py-6 text-center text-slate-500">
          <T en="No customers connected yet." hi="अभी कोई ग्राहक नहीं जुड़ा।" />
        </p>
      )}
    </>
  );
}
