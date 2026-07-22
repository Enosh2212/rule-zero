import { getApiBaseUrl } from "../contracts/api";
import { shoppingWorkerObservation } from "./observation";
import type { WorkerStepResponse } from "./types";

export async function proposeWorkerAction(stepIndex: number): Promise<WorkerStepResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/worker/propose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scenario_id: "shopping-trap",
      step_index: stepIndex,
      contract: null,
      observation: shoppingWorkerObservation,
    }),
  });

  if (!response.ok) {
    throw new Error(`Worker proposal service returned ${response.status}.`);
  }

  return (await response.json()) as WorkerStepResponse;
}
