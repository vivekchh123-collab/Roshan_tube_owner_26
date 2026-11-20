"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateInterested } from "@/app/actions";
import { useApp } from "./Providers";

type C = { id: string; name: string; mobile: string; location: string | null };

/** "Edit" button inside an interested customer's details (name, mobile, location). */
export function EditInterested({ c }: { c: C }) {
  const { tx } = useApp();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: c.name,
    mobile: c.mobile,
    location: c.location ?? "",
  });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setErr("");
    const r = await updateInterested(c.id, f.name, f.mobile, f.location);
    setBusy(false);
    if (!r.ok) {
      setErr(r.error || "Failed");
      return;
    }
    setOpen(false);
    router.refresh();
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-brand-blue px-4 py-2 text-sm font-bold text-brand-blue"
      >
        ✏️ {tx("Edit", "एडिट")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center">
          <div className="card max-h-[90vh] w-full max-w-md overflow-auto">
            <h2 className="mb-3 text-lg font-extrabold">
              {tx("Edit details", "विवरण बदलें")}
            </h2>
            <div className="space-y-3">
              <div>
                <label className="label">
                  {tx("Name of customer", "ग्राहक का नाम")}
                </label>
                <input
                  className="input"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                />
              </div>
              <div>
                <label className="label">
                  {tx("Mobile number", "मोबाइल नंबर")}
                </label>
                <input
                  className="input"
                  inputMode="numeric"
                  maxLength={10}
                  value={f.mobile}
                  onChange={(e) =>
                    setF({ ...f, mobile: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>
              <div>
                <label className="label">{tx("Location", "लोकेशन")}</label>
                <textarea
                  className="input"
                  rows={3}
                  value={f.location}
                  onChange={(e) => setF({ ...f, location: e.target.value })}
                />
              </div>
            </div>
            {err && (
              <p className="mt-2 text-sm font-semibold text-brand-red">{err}</p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="btn-outline flex-1"
                onClick={() => setOpen(false)}
              >
                {tx("Cancel", "रद्द")}
              </button>
              <button
                type="button"
                className="btn flex-1"
                onClick={save}
                disabled={busy}
              >
                {tx("Save", "सेव")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
