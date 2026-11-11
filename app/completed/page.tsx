import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import { cleanQuery, orFilter } from "@/lib/search";
import CustomerList from "@/components/CustomerList";
import SearchBar from "@/components/SearchBar";
import T from "@/components/T";

export const dynamic = "force-dynamic";

export default async function Completed({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireOwner();
  const q = cleanQuery((await searchParams).q);

  let query = db()
    .from("customers")
    .select("id,name,mobile,checklist,products")
    .eq("status", "completed")
    .order("completed_at", { ascending: false });
  if (q) query = query.or(orFilter(q));
  const { data } = await query;

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          <T en="Customer completed work" hi="ग्राहक का पूरा काम" />
        </h1>
        <SearchBar q={q} />
      </div>
      <p className="mb-4 text-sm text-slate-500">
        <T
          en="Untick any item inside a customer and they move back to pending automatically."
          hi="ग्राहक के अंदर कोई आइटम अनटिक करने पर वे अपने-आप पेंडिंग में लौट जाते हैं।"
        />
      </p>
      <CustomerList
        rows={(data ?? []) as never}
        empty={
          q
            ? [
                "No customer found for this search.",
                "इस खोज के लिए कोई ग्राहक नहीं मिला।",
              ]
            : ["No completed customers yet.", "अभी कोई पूरा काम नहीं है।"]
        }
      />
    </>
  );
}
