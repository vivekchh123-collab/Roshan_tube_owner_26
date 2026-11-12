import { requireOwner } from "@/lib/auth";
import { db } from "@/lib/supabase";
import {
  AddEmployee,
  ApplicantRow,
  EmployeeRow,
  Emp,
} from "@/components/EmployeeParts";
import T from "@/components/T";
import MarkSeen from "@/components/MarkSeen";

export const dynamic = "force-dynamic";

export default async function Employees() {
  await requireOwner();
  const { data } = await db()
    .from("employees")
    .select("id,name,mobile,email,status,allowed")
    .order("created_at", { ascending: false });
  const all = (data ?? []) as Emp[];

  // how many customers each employee submitted today (India time)
  const todayIST = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Kolkata",
  });
  const { data: todayRows } = await db()
    .from("customers")
    .select("employee_id")
    .gte("created_at", `${todayIST}T00:00:00+05:30`)
    .not("employee_id", "is", null);
  const todayCount: Record<string, number> = {};
  for (const r of todayRows ?? [])
    todayCount[r.employee_id as string] =
      (todayCount[r.employee_id as string] || 0) + 1;

  const active = all.filter((e) => e.allowed);
  const applicants = all.filter((e) => !e.allowed);
  return (
    <>
      <MarkSeen k="employees" />
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-extrabold text-brand-navy dark:text-white">
          <T en="Employee status" hi="कर्मचारी स्थिति" />
        </h1>
      </div>
      <div className="mt-3">
        <AddEmployee />
      </div>

      <h2 className="mt-6 text-lg font-extrabold">
        <T en="Currently working" hi="अभी काम कर रहे" /> ({active.length})
      </h2>
      <p className="mb-2 text-xs text-slate-500">
        <T
          en="Blue number = customers submitted today. Tap a name to see last 7 days and overall."
          hi="नीला नंबर = आज जोड़े गए ग्राहक। पिछले 7 दिन और कुल देखने के लिए नाम पर टैप करें।"
        />
      </p>
      <ul className="space-y-2">
        {active.map((e) => (
          <EmployeeRow key={e.id} e={e} today={todayCount[e.id] || 0} />
        ))}
      </ul>
      {active.length === 0 && (
        <p className="py-4 text-slate-500">
          <T en="No employees yet." hi="अभी कोई कर्मचारी नहीं।" />
        </p>
      )}

      <h2 className="mt-8 text-lg font-extrabold">
        <T
          en="Field-work applicants (from Careers)"
          hi="फील्ड वर्क आवेदक (करियर से)"
        />{" "}
        ({applicants.length})
      </h2>
      <ul className="mt-2 space-y-2">
        {applicants.map((e) => (
          <ApplicantRow key={e.id} e={e} />
        ))}
      </ul>
      {applicants.length === 0 && (
        <p className="py-4 text-slate-500">
          <T en="No pending applicants." hi="कोई लंबित आवेदक नहीं।" />
        </p>
      )}
    </>
  );
}
