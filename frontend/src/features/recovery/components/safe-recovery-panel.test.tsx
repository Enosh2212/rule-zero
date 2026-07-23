// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { ActionExecutionResponse, ControlledShoppingState } from "../../action-gate/types";
import type { TaskContract } from "../../contracts/types";
import type { ActionEvaluationResponse, RuleZeroDecision } from "../../interceptor/types";
import type { ProposedAgentAction } from "../../worker/types";
import type { RecoveryExecutionResponse, RecoveryPlan } from "../types";
import { SafeRecoveryPanel } from "./safe-recovery-panel";

const state: ControlledShoppingState = { scenario_id: "shopping-trap", cart_items: [], addons: { warranty_enabled: false, membership_enabled: false }, checkout_preview_reached: false, simulation_completed: false, state_version: 0 };
const changedState: ControlledShoppingState = { ...state, simulation_completed: true, state_version: 1 };
const contract = { schema_version: "1.0", original_instruction: "Buy a power bank under Rs 1500.", normalized_intent: "purchase:power_bank", allowed_item_categories: ["power_bank"], budget: { maximum_amount: 1500, currency: "INR", comparison: "less_than_or_equal" }, permissions: { allowed_actions: ["add_item_to_cart"], prohibited_actions: ["initiate_payment", "submit_order", "submit_form", "activate_subscription", "activate_recurring_payment", "share_sensitive_data"], actions_requiring_human_approval: ["navigate_external"], stop_before_payment: true }, sensitive_data_policy: { sharing_allowed: false, prohibited_data_categories: ["personal_information"], restriction_source: "explicit_instruction" }, parse_warnings: [], parser_completeness: "complete", parser_confidence: 1 } satisfies TaskContract;
const action: ProposedAgentAction = { schema_version: "1.0", action_id: "shopping-trap-action-008", sequence_number: 8, scenario_id: "shopping-trap", action_type: "make_payment", description: "Attempt payment", target: { type: "payment", id: "payment-boundary" }, payload: { attempt: true }, rationale: "Naive worker", source: { type: "worker_default_behaviour", trust_classification: "untrusted", evidence: "Default" }, expected_consequence: "Cross payment", would_mutate_state: true };
const recoveryAction: ProposedAgentAction = { ...action, action_id: "shopping-trap-action-901", sequence_number: 901, action_type: "finish_task", target: { type: "task", id: "shopping-trap-task" }, description: "Finish safely", payload: { reason: "safe_partial_completion" }, expected_consequence: "Stop safely" };

function evaluation(decision: RuleZeroDecision, actionId = action.action_id): ActionEvaluationResponse {
  return { schema_version: "1.0", evaluation_id: `rz-eval-${decision === "block" ? "1111111111111111" : "2222222222222222"}`, evaluated_action_id: actionId, scenario_id: "shopping-trap", decision, summary: decision, explanation: decision, triggered_policy_findings: [{ rule_id: decision === "block" ? "RZ-PAY-001" : "RZ-DEFAULT-001", severity: decision === "block" ? "critical" : "warning", recommended_decision: decision, message: decision, evidence: [] }], matched_contract_permissions: [], detected_contract_conflicts: [], action_source_trust_assessment: { source_type: "worker_default_behaviour", trust_classification: "untrusted", authorizes_action: false, summary: "source" }, consequence_assessment: { currency: "INR", immediate_one_time_cost: 0, recurring_monthly_cost: 0, current_due_today_total: 0, projected_due_today_total: 0, financial_impact_known: true, summary: "known" }, decision_trace: { precedence: [], evaluated_rules: [], resolution: decision }, human_approval_required: decision === "ask_approval", execution_occurred: false };
}

function gateResult(status: ActionExecutionResponse["status"], fresh = evaluation("block"), approval = false, after = state): ActionExecutionResponse {
  return { schema_version: "1.0", execution_id: "rz-exec-1111111111111111", status, refusal_reason: status === "refused" ? "rule_zero_block" : null, before_state: state, after_state: after, before_summary: "version=0", after_summary: `version=${after.state_version}`, fresh_evaluation: fresh, approval_request: approval ? { approval_request_id: "rz-approval-bound", status: "pending", scenario_id: "shopping-trap", action_id: recoveryAction.action_id, contract_fingerprint: "abc", state_version: 0, immediate_one_time_cost: 0, recurring_monthly_cost: 0, projected_total: 0, triggered_rules: ["RZ-DEFAULT-001"], reason: "finish", single_use_warning: "single-use" } : null, approval_record: null, triggered_rules: ["RZ-PAY-001"], execution_trace: { steps: ["re-ran Phase 4"] }, execution_occurred: status === "executed", state_changed: status === "executed" };
}

const refused = gateResult("refused");
const plan: RecoveryPlan = { schema_version: "1.0", recovery_plan_id: "rz-recovery-111111111111111111111111", scenario_id: "shopping-trap", contract_fingerprint: "abc", triggering_action_id: action.action_id, triggering_action_fingerprint: "action-fingerprint", triggering_evaluation_id: evaluation("block").evaluation_id, bound_state_version: 0, trigger: "prohibited_payment", reason: "hard_side_effect_boundary", strategies: ["skip_prohibited_action", "stop_before_payment", "finish_with_safe_partial_completion"], summary: "Stop safely before payment.", explanation: "Payment is not retried.", preserved_user_constraints: ["Maximum budget remains INR 1500", "Stop before payment"], unsafe_behaviour_removed: ["Attempt payment"], steps: [{ step_id: "rz-recovery-step-001", sequence_number: 1, expected_state_version: 0, proposed_action: recoveryAction, reason: "Finish without payment", preserved_constraint: "Stop before payment", expected_consequence: "Safe partial completion", mutates_controlled_state: true, approval_may_be_required: true, execution_status: "pending" }], expected_final_state: changedState, full_task_completion_possible: false, human_approval_may_still_be_required: true, completion_status: "partial_completion", trace: { steps: ["verified block", "preserved contract"] }, warnings: ["Explicit click required"] };

function recoveryResult(status: RecoveryExecutionResponse["step_status"], approval = false, after = state): RecoveryExecutionResponse {
  const fresh = evaluation(approval ? "ask_approval" : "allow", recoveryAction.action_id);
  return { schema_version: "1.0", recovery_plan_id: plan.recovery_plan_id, executed_step_index: 0, step_status: status, next_step_index: null, completion_status: status === "completed" ? "partial_completion" : "in_progress", fresh_evaluation: fresh, execution_response: gateResult(approval ? "approval_required" : "executed", fresh, approval, after), before_state: state, after_state: after, state_changed: after.state_version !== 0, trace: { steps: ["Phase 5 gate"] } };
}

function fetchSequence(...items: Array<object | "error">) { return vi.fn().mockImplementation(() => { const item = items.shift(); return item === "error" ? Promise.reject(new Error("offline")) : Promise.resolve({ ok: true, json: async () => item }); }); }
function props(overrides: Partial<Parameters<typeof SafeRecoveryPanel>[0]> = {}) { return { proposedAction: action, contract, evaluation: evaluation("block"), executionResponse: refused, controlledState: state, onStateChange: vi.fn(), ...overrides }; }

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("SafeRecoveryPanel", () => {
  it("is hidden without a recovery trigger", () => {
    render(<SafeRecoveryPanel {...props({ evaluation: evaluation("allow"), executionResponse: null })} />);
    expect(screen.queryByRole("heading", { name: /safe recovery planner/i })).toBeNull();
  });

  it("BLOCK and rejected approval display recovery without auto execution", () => {
    vi.stubGlobal("fetch", fetchSequence());
    const view = render(<SafeRecoveryPanel {...props()} />);
    expect(screen.getByRole("button", { name: /generate safe recovery plan/i })).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
    view.rerender(<SafeRecoveryPanel {...props({ evaluation: evaluation("ask_approval"), executionResponse: gateResult("rejected", evaluation("ask_approval")) })} />);
    expect(screen.getByText(/Recovery is needed/i)).toBeTruthy();
  });

  it("renders plan, constraints, ordered steps, timeline, trace, and raw JSON", async () => {
    vi.stubGlobal("fetch", fetchSequence({ recovery_plan: plan }));
    render(<SafeRecoveryPanel {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: /generate safe recovery plan/i }));
    expect(await screen.findByText(plan.summary)).toBeTruthy();
    expect(screen.getByText("Maximum budget remains INR 1500")).toBeTruthy();
    expect(screen.getByText(/1. Finish safely/)).toBeTruthy();
    expect(screen.getByText("Unsafe Worker Proposal")).toBeTruthy();
    fireEvent.click(screen.getByText(/deterministic recovery trace/i));
    expect(screen.getByText("verified block")).toBeTruthy();
    fireEvent.click(screen.getByText(/raw recovery plan JSON/i));
    expect(screen.getAllByText(new RegExp(plan.recovery_plan_id)).length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: /execute all/i })).toBeNull();
  });

  it("executes exactly one clicked step and updates state only from backend", async () => {
    const onStateChange = vi.fn();
    vi.stubGlobal("fetch", fetchSequence({ recovery_plan: plan }, recoveryResult("completed", false, changedState)));
    render(<SafeRecoveryPanel {...props({ onStateChange })} />);
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));
    fireEvent.click(await screen.findByRole("button", { name: /execute current recovery step/i }));
    await waitFor(() => expect(onStateChange).toHaveBeenCalledWith(changedState));
    expect(screen.getByText(/Safe task outcome/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /execute current recovery step/i })).toBeNull();
    expect(contract.budget.maximum_amount).toBe(1500);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("ASK_APPROVAL uses explicit Phase 5 approval and never auto-approves", async () => {
    const consumed = { ...gateResult("executed", evaluation("ask_approval", recoveryAction.action_id), false, changedState), approval_record: { approval_request_id: "rz-approval-bound", status: "consumed", message: "used" } };
    vi.stubGlobal("fetch", fetchSequence({ recovery_plan: plan }, recoveryResult("approval_required", true), consumed));
    render(<SafeRecoveryPanel {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));
    fireEvent.click(await screen.findByRole("button", { name: /execute current/i }));
    expect(await screen.findByText(/explicit Phase 5 approval is required/i)).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(2);
    fireEvent.click(screen.getByRole("button", { name: /approve once/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(3));
    expect(await screen.findByText(/Safe task outcome/i)).toBeTruthy();
  });

  it("failed or stale step leaves state unchanged and shows API error", async () => {
    const onStateChange = vi.fn();
    vi.stubGlobal("fetch", fetchSequence({ recovery_plan: plan }, "error"));
    render(<SafeRecoveryPanel {...props({ onStateChange })} />);
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));
    fireEvent.click(await screen.findByRole("button", { name: /execute current/i }));
    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByRole("alert").textContent).toContain("stale");
    expect(onStateChange).not.toHaveBeenCalled();
  });

  it("supports skip and reset and labels partial outcome", async () => {
    vi.stubGlobal("fetch", fetchSequence({ recovery_plan: plan }));
    render(<SafeRecoveryPanel {...props()} />);
    fireEvent.click(screen.getByRole("button", { name: /skip recovery/i }));
    expect(screen.getByText(/Recovery skipped/i)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /reset recovery/i }));
    fireEvent.click(screen.getByRole("button", { name: /generate/i }));
    expect((await screen.findAllByText(/Safe partial completion/i)).length).toBeGreaterThan(0);
  });
});
