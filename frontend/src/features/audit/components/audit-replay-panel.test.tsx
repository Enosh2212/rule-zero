// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ControlledShoppingState } from "../../action-gate/types";
import type { TaskContract } from "../../contracts/types";
import type { AuditArtifact, AuditEvent, AuditSession, AuditVerification } from "../types";
import { AuditReplayPanel } from "./audit-replay-panel";

const state: ControlledShoppingState = { scenario_id: "shopping-trap", cart_items: [], addons: { warranty_enabled: false, membership_enabled: false }, checkout_preview_reached: false, simulation_completed: false, state_version: 0 };
const contract = { schema_version: "1.0", original_instruction: "Buy a power bank under Rs 1500.", normalized_intent: "purchase:power_bank", allowed_item_categories: ["power_bank"], budget: { maximum_amount: 1500, currency: "INR", comparison: "less_than_or_equal" }, permissions: { allowed_actions: ["browse_catalogue"], prohibited_actions: ["initiate_payment", "submit_order", "submit_form", "activate_subscription", "activate_recurring_payment", "share_sensitive_data"], actions_requiring_human_approval: ["navigate_external"], stop_before_payment: true }, sensitive_data_policy: { sharing_allowed: false, prohibited_data_categories: ["personal_information"], restriction_source: "explicit_instruction" }, parse_warnings: [], parser_completeness: "complete", parser_confidence: 1 } satisfies TaskContract;

function event(sequence: number, type = "session_started", status: string | null = null): AuditEvent { const hash = String(sequence).repeat(64); return { schema_version: "1.0", session_id: "rz-audit-session", event_id: `event-${sequence}`, sequence_number: sequence, event_type: type, phase: type.includes("recovery") ? "phase_6" : type.includes("action") ? "phase_4" : "phase_7", actor: type.includes("recovery") ? "recovery_planner" : type.includes("action") ? "rule_zero_interceptor" : "system", summary: `${type} summary`, explanation: "Recorded result", references: { scenario_id: "shopping-trap", contract_fingerprint: "fp", action_id: type.includes("action") ? "shopping-trap-action-001" : null, evaluation_id: null, approval_request_id: null, recovery_plan_id: type.includes("recovery") ? "plan-1" : null, recovery_step_id: null }, decision_or_status: status, state_transition: { before_state_version: sequence > 1 ? 0 : 0, after_state_version: sequence > 2 ? 1 : 0, live_state_changed: sequence > 2, redacted_state_summary: `state ${sequence}` }, policy_rule_ids: type === "action_blocked" ? ["RZ-PAY-001"] : [], redacted_payload_summary: { password: "[REDACTED]", decision: status }, previous_event_hash: sequence === 1 ? "0".repeat(64) : String(sequence - 1).repeat(64), current_event_hash: hash, payload_digest: "d".repeat(64), integrity: { algorithm: "HMAC-SHA256", redaction_version: "1.0", server_signed: true } }; }
function session(events: readonly AuditEvent[] = [event(1)]): AuditSession { return { schema_version: "1.0", session_id: "rz-audit-session", scenario_id: "shopping-trap", contract_fingerprint: "fp", original_instruction: contract.original_instruction, contract_summary: { normalized_intent: "purchase:power_bank", maximum_budget: 1500 }, initial_state: state, final_state_version: events.at(-1)?.state_transition.after_state_version ?? 0, events, event_count: events.length, head_hash: events.at(-1)?.current_event_hash ?? "0".repeat(64), integrity_status: "valid" }; }
const verification: AuditVerification = { integrity_status: "valid", verified_event_count: 4, first_invalid_sequence: null, integrity_findings: [{ code: "CHAIN_VALID", severity: "info", sequence_number: null, message: "valid" }], relationship_findings: [], state_continuity_findings: [], scenario_consistent: true, outcome: { original_goal: "purchase:power_bank", constraints_preserved: ["budget=1500"], unsafe_actions_blocked: 1, allowed_actions: 1, approvals_requested: 1, approvals_approved: 0, approvals_rejected: 0, controlled_actions_executed: 1, refused_actions: 0, recovery_plans: 1, recovery_steps_executed: 1, final_state_version: 1, completion: "partial", safety_summary: "Safe partial completion." } };
const artifact: AuditArtifact = { artifact_type: "worker_proposal", artifact: { action_id: "shopping-trap-action-001" }, artifact_key: "worker:1" };
function fetchSequence(...items: Array<object | "error">) { return vi.fn().mockImplementation(() => { const item = items.shift(); return item === "error" ? Promise.reject(new Error("offline")) : Promise.resolve({ ok: true, json: async () => item }); }); }

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("AuditReplayPanel", () => {
  it("shows pre-session state and starts a session", async () => {
    vi.stubGlobal("fetch", fetchSequence({ session: session() }));
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={null} />);
    expect(screen.getByRole("button", { name: /start audit session/i })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /start audit session/i }));
    expect(await screen.findByText(/Session: rz-audit-session/)).toBeTruthy();
    expect(screen.getByText("Events: 1")).toBeTruthy();
  });

  it("automatically records only a completed artifact and renders chronological events", async () => {
    const events = [event(1), event(2, "action_allowed", "allow"), event(3, "action_blocked", "block"), event(4, "approval_requested", "approval_required"), event(5, "recovery_plan_generated", "partial_completion")];
    vi.stubGlobal("fetch", fetchSequence({ session: session() }, { session: session(events), appended_event: events[4] }));
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={artifact} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    expect(await screen.findByText("Events: 5")).toBeTruthy();
    expect(screen.getByText(/action allowed/i)).toBeTruthy();
    expect(screen.getByText(/action blocked/i)).toBeTruthy();
    expect(screen.getByText(/approval requested/i)).toBeTruthy();
    expect(screen.getByText(/recovery plan generated/i)).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("shows append warning and manually retries without repeating the original operation", async () => {
    const updated = session([event(1), event(2, "worker_action_proposed", "proposed")]);
    vi.stubGlobal("fetch", fetchSequence({ session: session() }, "error", { session: updated, appended_event: updated.events[1] }));
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={artifact} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("not repeated");
    fireEvent.click(screen.getByRole("button", { name: /retry recording/i }));
    expect(await screen.findByText("Events: 2")).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("verifies valid and invalid integrity and renders outcome summary", async () => {
    const invalid = { ...verification, integrity_status: "invalid" as const, first_invalid_sequence: 2 };
    vi.stubGlobal("fetch", fetchSequence({ session: session() }, invalid));
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={null} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    fireEvent.click(await screen.findByRole("button", { name: /verify audit chain/i }));
    expect(await screen.findByText(/Audit integrity invalid at event 2/i)).toBeTruthy();
    expect(screen.getByText(/Original goal: purchase:power_bank/i)).toBeTruthy();
    expect(screen.getByText(/Unsafe actions blocked: 1/)).toBeTruthy();
  });

  it("exports JSON and Markdown with downloadable read-only content", async () => {
    const jsonExport = { format: "json", filename: "audit.json", media_type: "application/json", content: "{\"project\":\"Rule Zero\"}", verification };
    const markdownExport = { format: "markdown", filename: "audit.md", media_type: "text/markdown", content: "# Rule Zero Audit Report", verification };
    vi.stubGlobal("fetch", fetchSequence({ session: session() }, jsonExport, markdownExport));
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={null} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    fireEvent.click(await screen.findByRole("button", { name: /export json/i }));
    expect(await screen.findByText(/Download audit.json/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /export markdown/i }));
    expect(await screen.findByText(/Download audit.md/i)).toBeTruthy();
  });

  it("manual replay changes only replay position and makes no network action calls", async () => {
    const replaySession = session([event(1), event(2, "action_allowed", "allow"), event(3, "action_executed", "executed")]);
    const fetchMock = fetchSequence({ session: replaySession }); vi.stubGlobal("fetch", fetchMock);
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={null} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^start replay$/i }));
    expect(screen.getByText(/Replay position 1 of 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /next event/i }));
    expect(screen.getByText(/Replay position 2 of 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /previous event/i }));
    expect(screen.getByText(/Replay position 1 of 3/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /restart replay/i }));
    expect(screen.getByText(/Reconstructed read-only state version: 0/)).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/actions/") || String(url).includes("/worker/") || String(url).includes("/recovery/"))).toBe(false);
  });

  it("shows redacted payload, handles start API error, and resets audit", async () => {
    vi.stubGlobal("fetch", fetchSequence({ session: session([event(1), event(2, "action_blocked", "block")]) }));
    const view = render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={null} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    fireEvent.click(await screen.findAllByText(/redacted payload summary/i).then((items) => items[1]));
    expect(screen.getAllByText(/\[REDACTED\]/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /reset audit session/i }));
    expect(screen.getByRole("button", { name: /start audit session/i })).toBeTruthy();
    view.unmount();
    vi.stubGlobal("fetch", fetchSequence("error"));
    render(<AuditReplayPanel contract={contract} controlledState={state} latestArtifact={null} />);
    fireEvent.click(screen.getByRole("button", { name: /start audit/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
  });
});
