"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { markSeen } from "@/app/actions";

/** Put on a page: when the owner opens it, its red dot is cleared. */
export default function MarkSeen({
  k,
}: {
  k: "pending" | "not_interested" | "completed" | "employees";
}) {
  const router = useRouter();
  useEffect(() => {
    markSeen(k)
      .then(() => router.refresh())
      .catch(() => {});
  }, [k, router]);
  return null;
}
