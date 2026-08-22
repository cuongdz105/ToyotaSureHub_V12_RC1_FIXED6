import { getPriorityTasks } from "./priorityEngine";

let storedPlan = [];

export async function getWorkPlan() {
  const tasks = await getPriorityTasks();
  const previous = storedPlan;
  const now = new Date().toISOString();
  const activeIds = new Set(tasks.map((task) => String(task.carId)));
  const validPrevious = previous.filter((item) => activeIds.has(String(item.carId)));
  const nextPlan = tasks.map((task) => {
    const old = validPrevious.find((item) => String(item.carId) === String(task.carId));
    return {
      ...task,
      firstSeenAt: old?.firstSeenAt || now,
      lastEvaluatedAt: now,
      status: old?.status || "pending",
      startedAt: old?.startedAt || null,
    };
  });
  storedPlan = nextPlan;
  return nextPlan;
}

export async function getWorkPlanTask(carId) {
  const plan = await getWorkPlan();
  return plan.find((task) => String(task.carId) === String(carId)) || null;
}

export async function markWorkPlanStarted(carId) {
  const plan = await getWorkPlan();
  storedPlan = plan.map((item) => String(item.carId) === String(carId) ? { ...item, status: "in_progress", startedAt: item.startedAt || new Date().toISOString() } : item);
  return storedPlan.find((item) => String(item.carId) === String(carId)) || null;
}

export function clearWorkPlanForCar(carId) {
  storedPlan = storedPlan.filter((item) => String(item.carId) !== String(carId));
  return storedPlan;
}

export function clearWorkPlan() { storedPlan = []; }
export const WORK_PLAN_STORAGE_KEY = "memory:toyota_sure_hub_work_plan_v12";
