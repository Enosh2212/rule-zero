import type { ActionExecutionRequest, ActionExecutionResponse, ApprovalDecisionRequest, ScenarioSnapshot } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, init);
  if (!response.ok) throw new Error(`Safe Action Gate request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export function loadShoppingState(): Promise<ScenarioSnapshot> {
  return json<ScenarioSnapshot>("/api/scenarios/shopping-trap/state");
}

export function executeControlledAction(request: ActionExecutionRequest): Promise<ActionExecutionResponse> {
  return json<ActionExecutionResponse>("/api/actions/execute", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
  });
}

export function decideControlledApproval(request: ApprovalDecisionRequest): Promise<ActionExecutionResponse> {
  return json<ActionExecutionResponse>("/api/approvals/decide", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request),
  });
}
