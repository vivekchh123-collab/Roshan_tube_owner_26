import { db } from "@/lib/supabase";
import { isOwner } from "@/lib/auth";

export type Badges = {
  pending: boolean;
  not_interested: boolean;
  completed: boolean;
  employees: boolean;
};
const none: Badges = {
  pending: false,
  not_interested: false,
  completed: false,
  employees: false,
};

/** Which menu items have something new since the owner last opened that page (shown as a red dot). */
export async function getBadges(): Promise<Badges> {
  if (!(await isOwner())) return none;
  try {
    const sb = db();
    const { data } = await sb
      .from("settings")
      .select("key,value")
      .in("key", [
        "seen_pending",
        "seen_not_interested",
        "seen_completed",
        "seen_employees",
      ]);
    const seen = (k: string) =>
      String(
        (data ?? []).find((r) => r.key === `seen_${k}`)?.value ??
          "1970-01-01T00:00:00Z",
      );
    const cnt = async (q: PromiseLike<{ count: number | null }>) =>
      ((await q).count ?? 0) > 0;
    const [pending, not_interested, completed, newCust, newApplicants] =
      await Promise.all([
        cnt(
          sb
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending")
            .gt("created_at", seen("pending")),
        ),
        cnt(
          sb
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("status", "not_interested")
            .gt("created_at", seen("not_interested")),
        ),
        cnt(
          sb
            .from("customers")
            .select("id", { count: "exact", head: true })
            .eq("status", "completed")
            .gt("completed_at", seen("completed")),
        ),
        cnt(
          sb
            .from("customers")
            .select("id", { count: "exact", head: true })
            .not("employee_id", "is", null)
            .gt("created_at", seen("employees")),
        ),
        cnt(
          sb
            .from("employees")
            .select("id", { count: "exact", head: true })
            .eq("allowed", false)
            .gt("created_at", seen("employees")),
        ),
      ]);
    return {
      pending,
      not_interested,
      completed,
      employees: newCust || newApplicants,
    };
  } catch {
    return none;
  }
}
