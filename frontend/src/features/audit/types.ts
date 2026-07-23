import type { ControlledShoppingState } from "../action-gate/types";

export type AuditArtifactType = "worker_proposal" | "evaluation" | "execution_response" | "approval_response" | "recovery_plan" | "recovery_execution_response";
export type AuditArtifact = Readonly<{ artifact_type: AuditArtifactType; artifact: object; artifact_key: string }>;

export type AuditEvent = Readonly<{
  schema_version: "1.0"; session_id: string; event_id: string; sequence_number: number;
  event_type: string; phase: string; actor: string; summary: string; explanation: string;
  references: Readonly<{ scenario_id: "shopping-trap"; contract_fingerprint: string | null; action_id: string | null; evaluation_id: string | null; approval_request_id: string | null; recovery_plan_id: string | null; recovery_step_id: string | null }>;
  decision_or_status: string | null;
  state_transition: Readonly<{ before_state_version: number | null; after_state_version: number | null; live_state_changed: boolean; redacted_state_summary: string }>;
  policy_rule_ids: readonly string[]; redacted_payload_summary: Readonly<Record<string, unknown>>;
  previous_event_hash: string; current_event_hash: string; payload_digest: string;
  integrity: Readonly<{ algorithm: "HMAC-SHA256"; redaction_version: "1.0"; server_signed: true }>;
}>;

export type AuditSession = Readonly<{
  schema_version: "1.0"; session_id: string; scenario_id: "shopping-trap"; contract_fingerprint: string;
  original_instruction: string; contract_summary: Readonly<Record<string, unknown>>; initial_state: ControlledShoppingState;
  final_state_version: number; events: readonly AuditEvent[]; event_count: number; head_hash: string;
  integrity_status: "valid" | "invalid" | "unverified";
}>;

export type AuditOutcome = Readonly<{
  original_goal: string; constraints_preserved: readonly string[]; unsafe_actions_blocked: number; allowed_actions: number;
  approvals_requested: number; approvals_approved: number; approvals_rejected: number; controlled_actions_executed: number;
  refused_actions: number; recovery_plans: number; recovery_steps_executed: number; final_state_version: number;
  completion: "in_progress" | "full" | "partial"; safety_summary: string;
}>;

export type AuditVerification = Readonly<{
  integrity_status: "valid" | "invalid"; verified_event_count: number; first_invalid_sequence: number | null;
  integrity_findings: readonly Readonly<{ code: string; severity: string; sequence_number: number | null; message: string }>[];
  relationship_findings: readonly object[]; state_continuity_findings: readonly object[]; scenario_consistent: boolean; outcome: AuditOutcome;
}>;

export type AuditExport = Readonly<{ format: "json" | "markdown"; filename: string; media_type: string; content: string; verification: AuditVerification }>;
