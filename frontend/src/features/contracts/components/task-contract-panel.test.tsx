// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { TaskContract } from "../types";
import {
  ContractPreview,
  DEFAULT_TASK_INSTRUCTION,
  TaskContractPanel,
} from "./task-contract-panel";

const contract: TaskContract = {
  schema_version: "1.0",
  original_instruction: DEFAULT_TASK_INSTRUCTION,
  normalized_intent: "purchase:power_bank",
  allowed_item_categories: ["power_bank"],
  budget: { maximum_amount: 1_500, currency: "INR", comparison: "less_than_or_equal" },
  permissions: {
    allowed_actions: ["browse_catalogue", "inspect_product", "add_item_to_cart"],
    prohibited_actions: ["initiate_payment", "activate_subscription", "share_sensitive_data"],
    actions_requiring_human_approval: ["navigate_external"],
    stop_before_payment: true,
  },
  sensitive_data_policy: {
    sharing_allowed: false,
    prohibited_data_categories: ["personal_information"],
    restriction_source: "explicit_instruction",
  },
  parse_warnings: [
    {
      code: "FORM_SUBMISSION_DEFAULTED_PROHIBITED",
      field: "permissions.prohibited_actions",
      message: "Form submission is prohibited by default.",
    },
  ],
  parser_completeness: "complete_with_defaults",
  parser_confidence: 0.88,
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("TaskContractPanel", () => {
  it("starts with the default demonstration instruction", () => {
    render(<TaskContractPanel />);
    expect((screen.getByLabelText("User instruction") as HTMLTextAreaElement).value).toBe(
      DEFAULT_TASK_INSTRUCTION,
    );
  });

  it("renders the generated contract and budget", () => {
    render(<ContractPreview contract={contract} />);
    expect(screen.getByRole("heading", { name: "Generated safety contract" })).toBeTruthy();
    expect(screen.getByText("₹1,500")).toBeTruthy();
    expect(screen.getByText("purchase:power_bank")).toBeTruthy();
  });

  it("displays prohibited permissions", () => {
    render(<ContractPreview contract={contract} />);
    expect(screen.getByText("initiate payment")).toBeTruthy();
    expect(screen.getByText("activate subscription")).toBeTruthy();
    expect(screen.getByText("share sensitive data")).toBeTruthy();
  });

  it("displays parse warnings", () => {
    render(<ContractPreview contract={contract} />);
    expect(screen.getByText("FORM_SUBMISSION_DEFAULTED_PROHIBITED")).toBeTruthy();
    expect(screen.getByText("Form submission is prohibited by default.")).toBeTruthy();
  });

  it("shows an accessible API error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<TaskContractPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Generate Safety Contract" }));

    await waitFor(() => {
      expect(screen.getByRole("alert").textContent).toContain("Unable to generate the safety contract");
    });
  });
});
