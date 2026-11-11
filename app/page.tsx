import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { cleanQuery, orFilter } from "@/lib/search";
import AddCustomer from "@/components/AddCustomer";
import CustomerList from "@/components/CustomerList";
import SearchBar from "@/components/SearchBar";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOwner();
  const q = cleanQuery((await searchParams).q);

  let query = db()
    .from("customers")
    .select("id,name,mobile,checklist,products")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (q) query = query.or(orFilter(q));
  const { data } = await query;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          <T en="Customer pending work" hi="ग्राहक का पेंडिंग काम" />
        </h1>
        <div className="flex items-center gap-2">
          <AddCustomer />
          <SearchBar q={q} />
        </div>
      </div>
      <div className="mt-4">
        <CustomerList
          rows={(data ?? []) as never}
          empty={
            q
              ? [
                  "No customer found for this search.",
                  "इस खोज के लिए कोई ग्राहक नहीं मिला।",
                ]
              : [
                  "No pending work. Add a customer to begin.",
                  "कोई पेंडिंग काम नहीं। शुरू करने के लिए ग्राहक जोड़ें।",
                ]
          }
        />
      </div>
    </>
  );
}
