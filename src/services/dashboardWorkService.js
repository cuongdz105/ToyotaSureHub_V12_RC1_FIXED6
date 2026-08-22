import { getWorkPlan } from "./workPlanService";

export async function getDashboardWorkItems() {
  const plan = await getWorkPlan();
  return plan.slice(0, 8);
}

export async function getDashboardWorkSummary() {
  const plan = await getWorkPlan();
  return {
    total: plan.length,
    urgent: plan.filter((item) => item.score >= 80).length,
    inProgress: plan.filter((item) => item.type === "queue").length,
    newTasks: plan.filter((item) => item.type === "new_posting").length,
  };
}
