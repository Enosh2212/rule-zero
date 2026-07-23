import type { TaskContract } from "../contracts/types";
import type { ControlledShoppingState } from "../action-gate/types";
import type { RecoveryExecutionResponse, RecoveryPlan, RecoveryPlanRequest } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function post<T>(path: string, body: object): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(`Recovery request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export async function generateRecoveryPlan(request: RecoveryPlanRequest): Promise<RecoveryPlan> {
  const response = await post<{ recovery_plan: RecoveryPlan }>("/api/recovery/plan", request);
  return response.recovery_plan;
}

export function executeRecoveryStep(request: Readonly<{ scenario_id: "shopping-trap"; contract: TaskContract; recovery_plan: RecoveryPlan; step_index: number; current_state: ControlledShoppingState }>): Promise<RecoveryExecutionResponse> {
  return post<RecoveryExecutionResponse>("/api/recovery/execute-step", request);
}
