import { getApiBaseUrl } from "../contracts/api";
import { shoppingWorkerObservation } from "./observation";
import type { WorkerStepResponse } from "./types";
import { requestJson } from "../api-client";

export async function proposeWorkerAction(stepIndex: number): Promise<WorkerStepResponse> {
  return requestJson<WorkerStepResponse>(`${getApiBaseUrl()}/api/worker/propose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario_id: "shopping-trap",
      step_index: stepIndex,
      contract: null,
      observation: shoppingWorkerObservation,
    }),
  }, "Worker proposal request failed");
}
