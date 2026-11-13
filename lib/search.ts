// Helpers for the search icon on the owner pages. The search text arrives as ?q=... in the page address.

/** Keeps letters (English + Hindi), digits and spaces only, so the text is safe to use in a database filter. */
export function cleanQuery(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : (v ?? "");
  return s
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

/** Matches part of the name OR part of the mobile number (not case sensitive). */
export function orFilter(q: string, nameColumn = "name"): string {
  return `${nameColumn}.ilike.%${q}%,mobile.ilike.%${q}%`;
}

export type Sort = "new" | "old" | "callback";
/** Reads ?sort=... safely. Anything unknown falls back to the default. */
export function cleanSort(
  v: string | string[] | undefined,
  allowed: Sort[],
  fallback: Sort,
): Sort {
  const s = (Array.isArray(v) ? v[0] : v) as Sort | undefined;
  return s && allowed.includes(s) ? s : fallback;
}
