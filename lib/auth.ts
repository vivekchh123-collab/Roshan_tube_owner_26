import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

function ok(u: Awaited<ReturnType<typeof currentUser>>) {
  const p = u?.primaryEmailAddress;
  const owner = (process.env.OWNER_EMAIL || "").toLowerCase();
  return (
    !!u &&
    !!owner &&
    p?.emailAddress?.toLowerCase() === owner &&
    p?.verification?.status === "verified"
  );
}

/** For pages: sends visitors to sign-in, or to /denied if the email is not the owner's. */
export async function requireOwner() {
  const u = await currentUser();
  if (!u) redirect("/sign-in");
  if (!ok(u)) redirect("/denied");
  return u;
}

/** For server actions / API routes: throws unless the caller is the owner. */
export async function assertOwner() {
  const u = await currentUser();
  if (!ok(u)) throw new Error("Not allowed");
  return u!;
}

/** True only for the signed-in, verified owner (never redirects). */
export async function isOwner() {
  try {
    return ok(await currentUser());
  } catch {
    return false;
  }
}
