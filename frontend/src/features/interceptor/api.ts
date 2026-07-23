import { getApiBaseUrl } from "../contracts/api";
import type { ActionEvaluationRequest, ActionEvaluationResponse } from "./types";
import { requestJson } from "../api-client";

export async function evaluateProposedAction(
  request: ActionEvaluationRequest,
): Promise<ActionEvaluationResponse> {
  return requestJson<ActionEvaluationResponse>(`${getApiBaseUrl()}/api/interceptor/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  }, "Interceptor request failed");
}
