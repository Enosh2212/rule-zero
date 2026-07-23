// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TaskContract } from "../../contracts/types";
import type { ActionEvaluationResponse, RuleZeroDecision } from "../../interceptor/types";
import type { ProposedAgentAction } from "../../worker/types";
import type { ActionExecutionResponse, ControlledShoppingState } from "../types";
import { SafeActionGatePanel } from "./safe-action-gate-panel";

const state: ControlledShoppingState = { scenario_id: "shopping-trap", cart_items: [], addons: { warranty_enabled: false, membership_enabled: false }, checkout_preview_reached: false, simulation_completed: false, state_version: 0 };
const contract = { schema_version: "1.0", original_instruction: "Buy a power bank under Rs 1500.", normalized_intent: "purchase:power_bank", allowed_item_categories: ["power_bank"], budget: { maximum_amount: 1500, currency: "INR", comparison: "less_than_or_equal" }, permissions: { allowed_actions: ["add_item_to_cart"], prohibited_actions: ["initiate_payment", "submit_order", "submit_form", "activate_subscription", "activate_recurring_payment", "share_sensitive_data"], actions_requiring_human_approval: ["navigate_external"], stop_before_payment: true }, sensitive_data_policy: { sharing_allowed: false, prohibited_data_categories: ["personal_information"], restriction_source: "explicit_instruction" }, parse_warnings: [], parser_completeness: "complete", parser_confidence: 1 } satisfies TaskContract;
const action: ProposedAgentAction = { schema_version: "1.0", action_id: "shopping-trap-action-003", sequence_number: 3, scenario_id: "shopping-trap", action_type: "add_item", description: "Add item", target: { type: "product", id: "volt-mini-10k" }, payload: { quantity: 1 }, rationale: "Requested", source: { type: "user_instruction", trust_classification: "trusted", evidence: "User" }, expected_consequence: "Cart changes", would_mutate_state: true };

function evaluation(decision: RuleZeroDecision): ActionEvaluationResponse {
  return { schema_version: "1.0", evaluation_id: "rz-eval-0123456789abcdef", evaluated_action_id: action.action_id, scenario_id: "shopping-trap", decision, summary: decision, explanation: decision, triggered_policy_findings: [{ rule_id: decision === "block" ? "RZ-PAY-001" : decision === "ask_approval" ? "RZ-ADDON-001" : "RZ-BASE-001", severity: decision === "block" ? "critical" : "info", recommended_decision: decision, message: decision, evidence: [] }], matched_contract_permissions: [], detected_contract_conflicts: [], action_source_trust_assessment: { source_type: "user_instruction", trust_classification: "trusted", authorizes_action: false, summary: "source" }, consequence_assessment: { currency: "INR", immediate_one_time_cost: 399, recurring_monthly_cost: 0, current_due_today_total: 0, projected_due_today_total: 399, financial_impact_known: true, summary: "known" }, decision_trace: { precedence: [], evaluated_rules: [], resolution: decision }, human_approval_required: decision === "ask_approval", execution_occurred: false };
}

function result(status: ActionExecutionResponse["status"], approval = false): ActionExecutionResponse {
  const after = status === "executed" ? { ...state, state_version: 1, cart_items: [{ product_id: "volt-mini-10k", quantity: 1, unit_price: 1499 }] } : state;
  return { schema_version: "1.0", execution_id: "rz-exec-0123456789abcdef", status, refusal_reason: status === "refused" ? "rule_zero_block" : null, before_state: state, after_state: after, before_summary: "version=0", after_summary: `version=${after.state_version}`, fresh_evaluation: evaluation(approval ? "ask_approval" : status === "refused" ? "block" : "allow"), approval_request: approval ? { approval_request_id: "rz-approval-bound", status: "pending", scenario_id: "shopping-trap", action_id: action.action_id, contract_fingerprint: "abc", state_version: 0, immediate_one_time_cost: 399, recurring_monthly_cost: 199, projected_total: 399, triggered_rules: ["RZ-ADDON-001"], reason: "optional", single_use_warning: "Approval is single use." } : null, approval_record: status === "rejected" ? { approval_request_id: "rz-approval-bound", status: "rejected", message: "Rejected" } : null, triggered_rules: [], execution_trace: { steps: ["re-ran policy", "canonical executor"] }, execution_occurred: status === "executed", state_changed: status === "executed" };
}

function fetchSequence(...responses: Array<object | "error">) {
  return vi.fn().mockImplementation(() => { const next = responses.shift(); return next === "error" ? Promise.reject(new Error("offline")) : Promise.resolve({ ok: true, json: async () => next }); });
}

const snapshot = { schema_version: "1.0", products: [], warranty_id: "extended-warranty", warranty_price: 399, membership_id: "volt-plus", membership_monthly_price: 199, supported_actions: [], state };

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("SafeActionGatePanel", () => {
  it("loads initial state and has a reset control", async () => {
    vi.stubGlobal("fetch", fetchSequence(snapshot, snapshot));
    render(<SafeActionGatePanel proposedAction={null} contract={null} evaluation={null} />);
    expect(await screen.findByText("State version")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /reset controlled state/i }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });

  it("manually executes ALLOW and renders updated controlled state and trace", async () => {
    vi.stubGlobal("fetch", fetchSequence(snapshot, result("executed")));
    render(<SafeActionGatePanel proposedAction={action} contract={contract} evaluation={evaluation("allow")} />);
    fireEvent.click(await screen.findByRole("button", { name: /execute allowed action/i }));
    expect(await screen.findByText(/execution status: executed/i)).toBeTruthy();
    expect(screen.getByText(/volt-mini-10k × 1/i)).toBeTruthy();
    fireEvent.click(screen.getByText(/execution trace and raw result/i));
    expect(screen.getByText("canonical executor")).toBeTruthy();
  });

  it("shows BLOCK with no execution control", async () => {
    vi.stubGlobal("fetch", fetchSequence(snapshot));
    render(<SafeActionGatePanel proposedAction={action} contract={contract} evaluation={evaluation("block")} />);
    expect(await screen.findByText(/BLOCK enforced/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /execute allowed action/i })).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("shows approval consequences, supports approve once, and shows consumed state", async () => {
    const consumed = { ...result("executed"), approval_request: null, approval_record: { approval_request_id: "rz-approval-bound", status: "consumed", message: "Used once." } };
    vi.stubGlobal("fetch", fetchSequence(snapshot, result("approval_required", true), consumed));
    render(<SafeActionGatePanel proposedAction={action} contract={contract} evaluation={evaluation("ask_approval")} />);
    fireEvent.click(await screen.findByRole("button", { name: /request explicit approval/i }));
    expect(await screen.findByText(/approval required for this exact action/i)).toBeTruthy();
    expect(screen.getAllByText("₹399")).toHaveLength(2);
    expect(screen.getByText("₹199/month")).toBeTruthy();
    expect(screen.getAllByText(/RZ-ADDON-001/).length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByRole("button", { name: /approve once/i }));
    expect(await screen.findByText(/approval status: consumed/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /approve once/i })).toBeNull();
  });

  it("supports rejection without state change", async () => {
    vi.stubGlobal("fetch", fetchSequence(snapshot, result("approval_required", true), result("rejected")));
    render(<SafeActionGatePanel proposedAction={action} contract={contract} evaluation={evaluation("ask_approval")} />);
    fireEvent.click(await screen.findByRole("button", { name: /request explicit approval/i }));
    fireEvent.click(await screen.findByRole("button", { name: /^reject$/i }));
    expect(await screen.findByText(/execution status: rejected/i)).toBeTruthy();
    expect(screen.getByText("Empty")).toBeTruthy();
  });

  it("renders stale/refused result and API errors", async () => {
    vi.stubGlobal("fetch", fetchSequence(snapshot, result("refused")));
    const view = render(<SafeActionGatePanel proposedAction={action} contract={contract} evaluation={evaluation("allow")} />);
    fireEvent.click(await screen.findByRole("button", { name: /execute allowed action/i }));
    expect(await screen.findByText(/refusal reason: rule zero block/i)).toBeTruthy();
    view.unmount();
    vi.stubGlobal("fetch", fetchSequence("error"));
    render(<SafeActionGatePanel proposedAction={null} contract={null} evaluation={null} />);
    expect((await screen.findByRole("alert")).textContent).toContain("Unable to load");
  });

  it("requires the matching contract and evaluation and never auto-executes", async () => {
    vi.stubGlobal("fetch", fetchSequence(snapshot));
    const mismatched = { ...evaluation("allow"), evaluated_action_id: "shopping-trap-action-999" };
    render(<SafeActionGatePanel proposedAction={action} contract={contract} evaluation={mismatched} />);
    expect(await screen.findByText(/Evaluate this exact proposal/i)).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
