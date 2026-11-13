"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useApp } from "./Providers";

type Sort = "new" | "old" | "callback";
const LABEL: Record<Sort, [string, string]> = {
  new: ["Latest first", "नया पहले"],
  old: ["Oldest first", "पुराना पहले"],
  callback: ["Call-back soonest", "कॉलबैक नज़दीकी"],
};

// Small pill buttons under the page title: Latest first / Oldest first (and Call-back soonest on the Not-interested page).
// Choosing one changes ?sort=... in the address and keeps the search text.
export default function SortFilter({
  sort,
  options,
}: {
  sort: Sort;
  options: Sort[];
}) {
  const { tx } = useApp();
  const router = useRouter();
  const path = usePathname();
  const params = useSearchParams();

  function pick(s: Sort) {
    const sp = new URLSearchParams(params.toString());
    sp.set("sort", s);
    router.replace(`${path}?${sp.toString()}`, { scroll: false });
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label={tx("Sort", "क्रम")}
    >
      <span className="text-xs font-bold text-slate-500">
        ⇅ {tx("Sort:", "क्रम:")}
      </span>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => pick(o)}
          aria-pressed={sort === o}
          className={`rounded-full border px-3 py-1.5 text-sm font-bold transition ${sort === o ? "border-brand-blue bg-brand-blue text-white" : "border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"}`}
        >
          {tx(LABEL[o][0], LABEL[o][1])}
        </button>
      ))}
    </div>
  );
}
