import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { cleanQuery, orFilter } from "@/lib/search";
import SearchBar from "@/components/SearchBar";
import VerifyClient, { Issue } from "@/components/VerifyClient";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function Verify({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOwner();
  const q = cleanQuery((await searchParams).q);

  let query = db()
    .from("verification_issues")
    .select("id,customer_name,mobile,problem")
    .order("created_at", { ascending: false });
  if (q) query = query.or(orFilter(q, "customer_name"));
  const { data } = await query;

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          <T en="Verify customer detail" hi="ग्राहक विवरण जाँचें" />
        </h1>
        <SearchBar q={q} />
      </div>
      <VerifyClient issues={(data ?? []) as Issue[]} />
    </>
  );
}
