"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "./Providers";

// Search icon (top right). Tap it to open the box; type a name or number; the list filters automatically.
export default function SearchBar({ q }: { q: string }) {
  const { tx } = useApp();
  const router = useRouter();
  const path = usePathname();
  const [open, setOpen] = useState(q !== "");
  const [val, setVal] = useState(q);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) ref.current?.focus();
  }, [open]);

  // wait 0.35 s after typing stops, then reload the list with ?q=...
  useEffect(() => {
    const v = val.trim();
    if (v === q) return;
    const t = setTimeout(() => {
      router.replace(v ? `${path}?q=${encodeURIComponent(v)}` : path, {
        scroll: false,
      });
    }, 350);
    return () => clearTimeout(t);
  }, [val, q, path, router]);

  function close() {
    setVal("");
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-label={tx("Search", "खोजें")}
        className={`rounded-full border p-3 transition ${open ? "border-brand-blue bg-brand-blue text-white" : "border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"}`}
      >
        {open ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-[min(88vw,22rem)]">
          <input
            ref={ref}
            className="input shadow-lg"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") close();
            }}
            placeholder={tx("Search name or number", "नाम या नंबर खोजें")}
            aria-label={tx("Search name or number", "नाम या नंबर खोजें")}
          />
        </div>
      )}
    </div>
  );
}
