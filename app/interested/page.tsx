import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { cleanQuery, cleanSort, orFilter } from '@/lib/search';
import AddCustomer from '@/components/AddCustomer';
import CustomerList from '@/components/CustomerList';
import SearchBar from '@/components/SearchBar';
import SortFilter from '@/components/SortFilter';
import T from '@/components/T';
import MarkSeen from '@/components/MarkSeen';

export const dynamic = 'force-dynamic';

export default async function Interested({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  await requireOwner();
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const sort = cleanSort(sp.sort, ['new', 'old'], 'new');

  let query = db()
    .from('customers')
    .select('id,name,mobile,employee_name,created_at')
    .eq('status', 'interested')
    .order('created_at', { ascending: sort === 'old' });
  if (q) query = query.or(orFilter(q));
  const { data } = await query;

  return (
    <>
      <MarkSeen k="interested" />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white"><T en="Customer interested" hi="इच्छुक ग्राहक" /></h1>
        <div className="flex items-center gap-2">
          <AddCustomer status="interested" />
          <SearchBar q={q} />
        </div>
      </div>
      <div className="mt-3"><SortFilter sort={sort} options={['new', 'old']} /></div>
      <p className="mb-4 mt-3 text-sm text-slate-500"><T en="Customers who said yes. Tap the ▾ icon to move one to Pending work when the work starts." hi="जिन ग्राहकों ने हाँ कहा। काम शुरू होने पर ▾ आइकन दबाकर उसे पेंडिंग काम में भेजें।" /></p>
      <CustomerList
        status="interested"
        rows={(data ?? []) as never}
        empty={q ? ['No customer found for this search.', 'इस खोज के लिए कोई ग्राहक नहीं मिला।'] : ['No interested customers yet.', 'अभी कोई इच्छुक ग्राहक नहीं है।']}
      />
    </>
  );
}
