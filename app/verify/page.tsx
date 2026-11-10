import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import VerifyClient, { Issue } from '@/components/VerifyClient';
import T from '@/components/T';

export const dynamic = 'force-dynamic';

export default async function Verify() {
  await requireOwner();
  const { data } = await db().from('verification_issues').select('id,customer_name,mobile,problem').order('created_at', { ascending: false });
  return (
    <>
      <h1 className="mb-4 text-2xl font-extrabold text-brand-navy dark:text-white"><T en="Verify customer detail" hi="ग्राहक विवरण जाँचें" /></h1>
      <VerifyClient issues={(data ?? []) as Issue[]} />
    </>
  );
}
