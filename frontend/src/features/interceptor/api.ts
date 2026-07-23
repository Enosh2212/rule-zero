import { getApiBaseUrl } from "../contracts/api";
import type { ActionEvaluationRequest, ActionEvaluationResponse } from "./types";

export async function evaluateProposedAction(
  request: ActionEvaluationRequest,
): Promise<ActionEvaluationResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/interceptor/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Interceptor service returned ${response.status}.`);
  }

  return (await response.json()) as ActionEvaluationResponse;
}
