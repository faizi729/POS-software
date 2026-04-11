/** Human label for `Restaurant.plan` (includes `none` = no tier assigned). */
export function formatPlanLabel(plan: string | undefined | null): string {
  const p = (plan || "none").toLowerCase();
  if (p === "none") return "Unassigned";
  return p;
}
