// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedDemo, PolicyFindingsList } from "./guided-demo";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("GuidedDemo", () => {
  it("starts with three-act progress, one primary action, and the controlled storefront", () => {
    render(<GuidedDemo />);
    expect(screen.getByText((_content,element)=>element?.tagName==="BLOCKQUOTE"&&Boolean(element.textContent?.includes("Find a power bank under ₹1,500.")))).toBeTruthy();
    expect(screen.getByText("Volt Mini 10K")).toBeTruthy();
    expect(screen.getByText("₹1,499")).toBeTruthy();
    expect(screen.getByRole("img", {name:"Power bank image placeholder"})).toBeTruthy();
    expect(screen.getByRole("button", {name:"Run Shopping Agent"})).toBeTruthy();
    expect(screen.getByRole("list", {name:"Demo progress"}).children).toHaveLength(3);
    expect(screen.getByText("MISSION").getAttribute("aria-current")).toBe("step");
    expect(screen.queryByRole("button", {name:/Show Worker Proposal|Evaluate with Rule Zero|Execute Allowed Action|Finish Safely/})).toBeNull();
    expect(screen.getByRole("link", {name:"Advanced Security Lab"}).getAttribute("href")).toBe("/demo/shopping");
    expect(screen.getByText(/This is a controlled simulation/)).toBeTruthy();
  });

  it("reset is inert before the demo starts", () => {
    render(<GuidedDemo />);
    fireEvent.click(screen.getByRole("button", {name:"Reset"}));
    expect(screen.getByRole("button", {name:"Run Shopping Agent"})).toBeTruthy();
  });

  it("shows a designed error and preserves the explicit retry control", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<GuidedDemo />);
    fireEvent.click(screen.getByRole("button", {name:"Run Shopping Agent"}));
    expect((await screen.findByRole("alert")).textContent).toContain("Demo step failed: offline");
    expect(screen.getByRole("button", {name:"Run Shopping Agent"})).toBeTruthy();
  });

  it("renders repeated policy rule IDs without a duplicate-key warning", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(<PolicyFindingsList rules={[
      {rule_id:"RZ-DEFAULT-001",severity:"warning",recommended_decision:"block",message:"First default-deny finding",evidence:[]},
      {rule_id:"RZ-DEFAULT-001",severity:"warning",recommended_decision:"block",message:"Second default-deny finding",evidence:[]},
    ]}/>);
    expect(screen.getByText("First default-deny finding")).toBeTruthy();
    expect(screen.getByText("Second default-deny finding")).toBeTruthy();
    expect(consoleError.mock.calls.flat().join(" ")).not.toMatch(/same key|duplicate key|RZ-DEFAULT-001/i);
  });
});
