import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import AddCustomer from '@/components/AddCustomer';
import CustomerList from '@/components/CustomerList';
import T from '@/components/T';

export const dynamic = 'force-dynamic';

export default async function Home() {
  await requireOwner();
  const { data } = await db().from('customers').select('id,name,mobile,checklist,products').eq('status', 'pending').order('created_at', { ascending: false });
  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white"><T en="Customer pending work" hi="ग्राहक का पेंडिंग काम" /></h1>
        <AddCustomer />
      </div>
      <div className="mt-4">
        <CustomerList rows={(data ?? []) as never} empty={['No pending work. Add a customer to begin.', 'कोई पेंडिंग काम नहीं। शुरू करने के लिए ग्राहक जोड़ें।']} />
      </div>
    </>
  );
}
