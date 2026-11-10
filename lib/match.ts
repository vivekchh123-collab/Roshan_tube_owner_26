// Fuzzy name comparison for Indian names (spelling variants, initials order, honorifics).

const HONORIFICS = new Set(['shri', 'shree', 'sri', 'smt', 'shrimati', 'mr', 'mrs', 'ms', 'miss', 'kumari', 'km', 'late', 'dr', 'sh']);

export function normalizeName(s: string | null | undefined): string {
  if (!s) return '';
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !HONORIFICS.has(t))
    .sort()
    .join(' ');
}

function lev(a: string, b: string): number {
  const m = a.length, n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}

export function similarity(a: string | null | undefined, b: string | null | undefined): number {
  const x = normalizeName(a), y = normalizeName(b);
  if (!x || !y) return 0;
  return 1 - lev(x, y) / Math.max(x.length, y.length);
}

export const NAME_MATCH_THRESHOLD = 0.8;
export const namesMatch = (a: string | null | undefined, b: string | null | undefined) => similarity(a, b) >= NAME_MATCH_THRESHOLD;
