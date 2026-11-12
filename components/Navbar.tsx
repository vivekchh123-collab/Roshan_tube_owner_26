"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignOutButton } from "@clerk/nextjs";
import { CloseIcon, MenuIcon, MoonIcon, SunIcon } from "./Icons";
import { useApp } from "./Providers";
import type { Badges } from "@/lib/badges";

const ITEMS: { href: string; en: string; hi: string; dot?: keyof Badges }[] = [
  {
    href: "/",
    en: "Home (Pending work)",
    hi: "होम (पेंडिंग काम)",
    dot: "pending",
  },
  { href: "/verify", en: "Verify customer detail", hi: "ग्राहक विवरण जाँचें" },
  {
    href: "/completed",
    en: "Customer completed work",
    hi: "ग्राहक का पूरा काम",
    dot: "completed",
  },
  {
    href: "/employees",
    en: "Employee status",
    hi: "कर्मचारी स्थिति",
    dot: "employees",
  },
  {
    href: "/not-interested",
    en: "Customer not interested",
    hi: "अनिच्छुक ग्राहक",
    dot: "not_interested",
  },
  {
    href: "/edit",
    en: "First website edit access",
    hi: "पहली वेबसाइट एडिट एक्सेस",
  },
  { href: "/account", en: "My account / password", hi: "मेरा खाता / पासवर्ड" },
];

export default function Navbar({ badges }: { badges: Badges }) {
  const { lang, setLang, theme, toggleTheme, tx } = useApp();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const any =
    badges.pending ||
    badges.completed ||
    badges.employees ||
    badges.not_interested;
  // check for new customers every 30 seconds so the red dots appear without reloading
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 30000);
    return () => clearInterval(t);
  }, [router]);
  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 h-14 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-3">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="Roshan Tubes logo"
              className="h-9 w-9 rounded-full object-cover"
            />
            <span className="text-lg font-extrabold text-brand-navy dark:text-white">
              Roshan Tubes{" "}
              <span className="text-xs font-semibold text-brand-red">
                Owner
              </span>
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <div
              className="flex overflow-hidden rounded-lg border border-slate-300 text-sm font-bold dark:border-slate-700"
              role="group"
              aria-label="Language"
            >
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 ${lang === "en" ? "bg-brand-blue text-white" : ""}`}
              >
                A
              </button>
              <button
                onClick={() => setLang("hi")}
                className={`px-2.5 py-1 ${lang === "hi" ? "bg-brand-blue text-white" : ""}`}
              >
                अ
              </button>
            </div>
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>
            <SignedIn>
              <button
                onClick={() => setOpen(true)}
                aria-label="Menu"
                className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="relative block">
                  <MenuIcon />
                  {any && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-white dark:ring-slate-950" />
                  )}
                </span>
              </button>
            </SignedIn>
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <nav className="absolute right-0 top-0 flex h-full w-72 flex-col bg-white p-4 shadow-xl dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-extrabold">{tx("Menu", "मेन्यू")}</span>
              <button onClick={() => setOpen(false)} aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <ul className="flex-1 space-y-1 overflow-auto">
              {ITEMS.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-3 font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    {tx(i.en, i.hi)}
                    {i.dot && badges[i.dot] ? (
                      <span
                        className="h-3 w-3 rounded-full bg-red-600"
                        aria-label="New"
                      />
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
            {/* Logout at the bottom of the menu */}
            <SignOutButton redirectUrl="/sign-in">
              <button className="btn mt-3 w-full !bg-brand-red">
                {tx("Logout", "लॉग आउट")}
              </button>
            </SignOutButton>
          </nav>
        </div>
      )}
    </>
  );
}
