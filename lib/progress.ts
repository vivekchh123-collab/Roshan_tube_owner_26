export const REG_CHECKS: [string, string, string][] = [
  ['aadhaar', 'Aadhaar linked', 'आधार लिंक्ड'],
  ['pan', 'PAN linked', 'पैन लिंक्ड'],
  ['bill', 'Electric bill connection linked', 'बिजली बिल कनेक्शन लिंक्ड'],
  ['bank', 'Bank passbook linked', 'बैंक पासबुक लिंक्ड'],
  ['loan', 'Loan applied', 'लोन अप्लाई किया'],
];
export const INSTALL_CHECKS: [string, string, string][] = [
  ['gst', 'GST bill', 'GST बिल'],
  ['gps', 'GPS tag photo', 'GPS टैग फोटो'],
  ['netmeter', 'Net metering', 'नेट मीटरिंग'],
  ['subsidy', 'Applied subsidy', 'सब्सिडी अप्लाई की'],
];

export type Product = { id: string; name: string; serial: string };
export type Checklist = Record<string, boolean>;

/** 5 registration ticks + 1 (at least one product added) + 4 installation ticks = 10 items. */
export function progress(checklist: Checklist | null | undefined, products: Product[] | null | undefined) {
  const c = checklist ?? {};
  const keys = [...REG_CHECKS, ...INSTALL_CHECKS].map((k) => k[0]);
  const done = keys.filter((k) => c[k]).length + ((products?.length ?? 0) > 0 ? 1 : 0);
  const total = keys.length + 1;
  return { done, total, pct: Math.round((done / total) * 100) };
}
