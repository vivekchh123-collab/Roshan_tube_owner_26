import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import CustomerList from '@/components/CustomerList';
import T from '@/components/T';

export const dynamic = 'force-dynamic';

export default async function Completed() {
  await requireOwner();
  const { data } = await db().from('customers').select('id,name,mobile,checklist,products').eq('status', 'completed').order('completed_at', { ascending: false });
  return (
    <>
      <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white"><T en="Customer completed work" hi="ग्राहक का पूरा काम" /></h1>
      <p className="mb-4 text-sm text-slate-500"><T en="Untick any item inside a customer and they move back to pending automatically." hi="ग्राहक के अंदर कोई आइटम अनटिक करने पर वे अपने-आप पेंडिंग में लौट जाते हैं।" /></p>
      <CustomerList rows={(data ?? []) as never} empty={['No completed customers yet.', 'अभी कोई पूरा काम नहीं है।']} />
    </>
  );
}
