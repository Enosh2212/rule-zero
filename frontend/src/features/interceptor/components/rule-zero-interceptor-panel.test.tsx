// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_TASK_INSTRUCTION } from "../../contracts/components/task-contract-panel";
import type { TaskContract } from "../../contracts/types";
import { ShoppingStorefront } from "../../shopping/components/shopping-storefront";
import type { ProposedAgentAction, WorkerStepResponse } from "../../worker/types";
import type { ActionEvaluationResponse, EvaluationContext, RuleZeroDecision } from "../types";
import { RuleZeroInterceptorPanel } from "./rule-zero-interceptor-panel";

const contract: TaskContract = {
  schema_version: "1.0",
  original_instruction: DEFAULT_TASK_INSTRUCTION,
  normalized_intent: "purchase:power_bank",
  allowed_item_categories: ["power_bank"],
  budget: { maximum_amount: 1500, currency: "INR", comparison: "less_than_or_equal" },
  permissions: {
    allowed_actions: ["browse_catalogue", "inspect_product", "add_item_to_cart"],
    prohibited_actions: ["initiate_payment", "submit_order", "submit_form", "activate_subscription", "activate_recurring_payment", "share_sensitive_data"],
    actions_requiring_human_approval: ["navigate_external"],
    stop_before_payment: true,
  },
  sensitive_data_policy: {
    sharing_allowed: false,
    prohibited_data_categories: ["personal_information"],
    restriction_source: "explicit_instruction",
  },
  parse_warnings: [],
  parser_completeness: "complete",
  parser_confidence: 1,
};

const proposedAction: ProposedAgentAction = {
  schema_version: "1.0",
  action_id: "shopping-trap-action-001",
  sequence_number: 1,
  scenario_id: "shopping-trap",
  action_type: "inspect_catalogue",
  description: "Inspect catalogue.",
  target: { type: "catalogue", id: "power-bank-catalogue" },
  payload: { product_count: 3 },
  rationale: "Find products.",
  source: { type: "trusted_application_state", trust_classification: "trusted", evidence: "Catalogue." },
  expected_consequence: "Read catalogue.",
  would_mutate_state: false,
};

const evaluationContext: EvaluationContext = {
  currency: "INR",
  current_cart_total: 0,
  projected_cart_total: 0,
  immediate_one_time_cost: 0,
  recurring_monthly_cost: 0,
  financial_impact_known: true,
  item_category: null,
  optional_addon: false,
};

function evaluation(decision: RuleZeroDecision = "allow"): ActionEvaluationResponse {
  return {
    schema_version: "1.0",
    evaluation_id: "rz-eval-0123456789abcdef",
    evaluated_action_id: proposedAction.action_id,
    scenario_id: "shopping-trap",
    decision,
    summary: `${decision} summary`,
    explanation: `${decision} explanation`,
    triggered_policy_findings: [{
      rule_id: decision === "block" ? "RZ-PAY-001" : decision === "ask_approval" ? "RZ-ADDON-001" : "RZ-BASE-001",
      severity: decision === "block" ? "critical" : decision === "ask_approval" ? "warning" : "info",
      recommended_decision: decision,
      message: "Deterministic policy finding.",
      evidence: ["controlled evidence"],
    }],
    matched_contract_permissions: ["allowed:browse_catalogue"],
    detected_contract_conflicts: decision === "block" ? [{
      action_type: "make_payment",
      contract_field: "permissions.prohibited_actions",
      contract_value: "initiate_payment",
      explanation: "Payment is prohibited by the contract.",
    }] : [],
    action_source_trust_assessment: {
      source_type: "trusted_application_state",
      trust_classification: "trusted",
      authorizes_action: false,
      summary: "Trusted evidence does not authorize an action by itself.",
    },
    consequence_assessment: {
      currency: "INR",
      immediate_one_time_cost: 399,
      recurring_monthly_cost: 199,
      current_due_today_total: 0,
      projected_due_today_total: 399,
      financial_impact_known: true,
      summary: "Known deterministic consequence.",
    },
    decision_trace: {
      precedence: ["explicit prohibition", "human approval", "safe allow"],
      evaluated_rules: ["RZ-BASE-001"],
      resolution: "BLOCK overrides ASK_APPROVAL and ALLOW.",
    },
    human_approval_required: decision === "ask_approval",
    execution_occurred: false,
  };
}

function mockEvaluation(result: ActionEvaluationResponse) {
  return vi.fn().mockResolvedValue({ ok: true, json: async () => result });
}

function renderReady() {
  return render(
    <RuleZeroInterceptorPanel
      proposedAction={proposedAction}
      contract={contract}
      context={evaluationContext}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("RuleZeroInterceptorPanel", () => {
  it("renders a no-proposal state", () => {
    render(<RuleZeroInterceptorPanel proposedAction={null} contract={contract} context={null} />);
    expect(screen.getByText("No Worker proposal is available. Start the Worker simulation first.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Evaluate with Rule Zero" })).toBeNull();
  });

  it("shows the evaluation button for a proposal", () => {
    renderReady();
    expect(screen.getByRole("button", { name: "Evaluate with Rule Zero" })).toBeTruthy();
    expect(screen.getByText("Latest proposal: shopping-trap-action-001")).toBeTruthy();
  });

  it.each([
    ["allow", "Decision: ALLOW"],
    ["block", "Decision: BLOCK"],
    ["ask_approval", "Decision: ASK APPROVAL"],
  ] as const)("renders the %s decision with an accessible text label", async (decision, label) => {
    vi.stubGlobal("fetch", mockEvaluation(evaluation(decision)));
    renderReady();
    fireEvent.click(screen.getByRole("button", { name: "Evaluate with Rule Zero" }));
    expect((await screen.findByRole("status")).textContent).toContain(label);
  });

  it("displays rules, source trust, consequences, and conflicts", async () => {
    vi.stubGlobal("fetch", mockEvaluation(evaluation("block")));
    renderReady();
    fireEvent.click(screen.getByRole("button", { name: "Evaluate with Rule Zero" }));

    expect(await screen.findByText("RZ-PAY-001")).toBeTruthy();
    expect(screen.getByText("Severity: critical")).toBeTruthy();
    expect(screen.getByText("trusted · trusted application state")).toBeTruthy();
    expect(screen.getByText("Payment is prohibited by the contract.")).toBeTruthy();
    expect(screen.getAllByText("₹399")).toHaveLength(2);
    expect(screen.getByText("₹199")).toBeTruthy();
  });

  it("expands decision trace and raw evaluation JSON", async () => {
    vi.stubGlobal("fetch", mockEvaluation(evaluation()));
    renderReady();
    fireEvent.click(screen.getByRole("button", { name: "Evaluate with Rule Zero" }));
    const trace = await screen.findByText("Deterministic decision trace");
    const raw = screen.getByText("Raw evaluation JSON");
    fireEvent.click(trace);
    fireEvent.click(raw);
    expect((trace.parentElement as HTMLDetailsElement).open).toBe(true);
    expect(trace.parentElement?.textContent).toContain("explicit prohibition");
    expect((raw.parentElement as HTMLDetailsElement).open).toBe(true);
    expect(raw.parentElement?.textContent).toContain('"execution_occurred": false');
  });

  it("records repeated evaluations in history without changing the proposal", async () => {
    const fetchMock = mockEvaluation(evaluation());
    vi.stubGlobal("fetch", fetchMock);
    renderReady();
    const button = screen.getByRole("button", { name: "Evaluate with Rule Zero" });
    fireEvent.click(button);
    await screen.findByRole("status");
    fireEvent.click(button);
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    const history = screen.getByRole("heading", { name: "Evaluation history" }).parentElement;
    expect(within(history as HTMLElement).getAllByText("shopping-trap-action-001")).toHaveLength(2);
  });

  it("shows an accessible API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderReady();
    fireEvent.click(screen.getByRole("button", { name: "Evaluate with Rule Zero" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Unable to evaluate the proposal"));
  });

  it("preserves cart, Worker position, and Task Contract during evaluation", async () => {
    const workerResponse: WorkerStepResponse = {
      proposed_action: proposedAction,
      next_step_index: 1,
      is_complete: false,
      completion: { status: "in_progress", message: "Next proposal available." },
    };
    vi.stubGlobal("fetch", vi.fn().mockImplementation((url: string) => {
      if (url.endsWith("/api/contracts/parse")) return Promise.resolve({ ok: true, json: async () => ({ scenario_id: "shopping-trap", contract }) });
      if (url.endsWith("/api/worker/propose")) return Promise.resolve({ ok: true, json: async () => workerResponse });
      if (url.endsWith("/api/interceptor/evaluate")) return Promise.resolve({ ok: true, json: async () => evaluation() });
      return Promise.reject(new Error("unexpected endpoint"));
    }));
    render(<ShoppingStorefront />);

    fireEvent.click(screen.getByRole("button", { name: "Generate Safety Contract" }));
    await screen.findByRole("heading", { name: "Generated safety contract" });
    fireEvent.click(screen.getByRole("button", { name: "Start Worker Simulation" }));
    await screen.findByRole("heading", { name: "inspect catalogue" });
    expect(screen.getByText("Sequence position: 1 / 9")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Evaluate with Rule Zero" }));
    await screen.findByRole("status");

    expect(screen.getByText("Your cart is empty")).toBeTruthy();
    expect(screen.getByText("Sequence position: 1 / 9")).toBeTruthy();
    expect((screen.getByLabelText("User instruction") as HTMLTextAreaElement).value).toBe(DEFAULT_TASK_INSTRUCTION);
    expect(screen.getByRole("heading", { name: "Generated safety contract" })).toBeTruthy();
  });
});
