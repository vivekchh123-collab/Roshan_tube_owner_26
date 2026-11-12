"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer } from "@/app/actions";
import { useApp } from "./Providers";

export default function DeleteCustomerButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  const { tx } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function del() {
    if (
      !confirm(
        tx(`Delete ${name} permanently?`, `${name} को हमेशा के लिए हटाएँ?`),
      )
    )
      return;
    setBusy(true);
    await deleteCustomer(id);
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={del}
      disabled={busy}
      className="rounded-xl border border-brand-red px-4 py-2 text-sm font-bold text-brand-red"
    >
      🗑 {tx("Delete", "हटाएँ")}
    </button>
  );
}
