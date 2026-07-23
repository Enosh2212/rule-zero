import type { TaskContract } from "../contracts/types";
import type { ControlledShoppingState } from "../action-gate/types";
import type { AuditArtifact, AuditExport, AuditSession, AuditVerification } from "./types";
import { requestJson } from "../api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
async function post<T>(path: string, body: object): Promise<T> { return requestJson<T>(`${API_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }, "Audit request failed"); }

export async function startAudit(contract: TaskContract, initialState: ControlledShoppingState): Promise<AuditSession> { return (await post<{ session: AuditSession }>("/api/audit/start", { scenario_id: "shopping-trap", contract, initial_state: initialState })).session; }
export async function appendAudit(session: AuditSession, artifact: AuditArtifact): Promise<AuditSession> { return (await post<{ session: AuditSession }>("/api/audit/append", { session, source_artifact: { artifact_type: artifact.artifact_type, artifact: artifact.artifact } })).session; }
export function verifyAudit(session: AuditSession): Promise<AuditVerification> { return post("/api/audit/verify", { session }); }
export function exportAudit(session: AuditSession, format: "json" | "markdown"): Promise<AuditExport> { return post("/api/audit/export", { session, format }); }
