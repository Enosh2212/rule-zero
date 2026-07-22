import type { ContractParseResponse } from "./types";

const LOCAL_API_URL = "http://localhost:8000";

export function getApiBaseUrl(): string {
  const configuredUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  return configuredUrl ? configuredUrl.replace(/\/$/, "") : LOCAL_API_URL;
}

export async function parseTaskContract(instruction: string): Promise<ContractParseResponse> {
  const response = await fetch(`${getApiBaseUrl()}/api/contracts/parse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instruction, scenario_id: "shopping-trap" }),
  });

  if (!response.ok) {
    throw new Error(`Contract service returned ${response.status}.`);
  }

  return (await response.json()) as ContractParseResponse;
}
