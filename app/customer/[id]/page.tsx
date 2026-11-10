import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import CustomerDetail from '@/components/CustomerDetail';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requireOwner();
  const { id } = await params;
  const { data } = await db().from('customers').select('id,name,mobile,location,status,checklist,products').eq('id', id).maybeSingle();
  if (!data || data.status === 'not_interested') notFound();
  return <CustomerDetail c={data as never} />;
}
