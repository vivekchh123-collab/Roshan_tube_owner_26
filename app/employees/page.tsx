import { requireOwner } from '@/lib/auth';
import { db } from '@/lib/supabase';
import { AddEmployee, ApplicantRow, EmployeeRow, Emp } from '@/components/EmployeeParts';
import T from '@/components/T';

export const dynamic = 'force-dynamic';

export default async function Employees() {
  await requireOwner();
  const { data } = await db().from('employees').select('id,name,mobile,email,status,allowed').order('created_at', { ascending: false });
  const all = (data ?? []) as Emp[];
  const active = all.filter((e) => e.allowed);
  const applicants = all.filter((e) => !e.allowed);
  return (
    <>
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white"><T en="Employee status" hi="कर्मचारी स्थिति" /></h1>
      </div>
      <div className="mt-3"><AddEmployee /></div>

      <h2 className="mt-6 text-lg font-extrabold"><T en="Currently working" hi="अभी काम कर रहे" /> ({active.length})</h2>
      <p className="mb-2 text-xs text-slate-500"><T en="Tap a name to see which customers they connected with (today, last 7 days, overall)." hi="किस कर्मचारी ने किन ग्राहकों से संपर्क किया (आज, पिछले 7 दिन, कुल) देखने के लिए नाम पर टैप करें।" /></p>
      <ul className="space-y-2">{active.map((e) => <EmployeeRow key={e.id} e={e} />)}</ul>
      {active.length === 0 && <p className="py-4 text-slate-500"><T en="No employees yet." hi="अभी कोई कर्मचारी नहीं।" /></p>}

      <h2 className="mt-8 text-lg font-extrabold"><T en="Field-work applicants (from Careers)" hi="फील्ड वर्क आवेदक (करियर से)" /> ({applicants.length})</h2>
      <ul className="mt-2 space-y-2">{applicants.map((e) => <ApplicantRow key={e.id} e={e} />)}</ul>
      {applicants.length === 0 && <p className="py-4 text-slate-500"><T en="No pending applicants." hi="कोई लंबित आवेदक नहीं।" /></p>}
    </>
  );
}
