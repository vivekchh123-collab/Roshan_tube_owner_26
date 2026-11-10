'use client';
import { useApp } from './Providers';

/** Tiny bilingual text helper so server pages can render English/Hindi: <T en="Home" hi="होम" /> */
export default function T({ en, hi }: { en: string; hi: string }) {
  const { tx } = useApp();
  return <>{tx(en, hi)}</>;
}
