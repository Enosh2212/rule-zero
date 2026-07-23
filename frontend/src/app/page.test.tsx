// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(cleanup);

describe("landing page", () => {
  it("makes the evaluator story and controlled-demo boundary immediately visible", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { name:"Stop AI agents before they make unsafe decisions." })).toBeTruthy();
    expect(screen.getByText(/checks every important action before an AI agent clicks/)).toBeTruthy();
    expect(screen.getByText("Add Premium Membership")).toBeTruthy();
    expect(screen.getByText("₹199/month recurring")).toBeTruthy();
    expect(screen.getByText("BLOCKED")).toBeTruthy();
    expect(screen.getByText(/Recurring payment was never authorized/)).toBeTruthy();
    expect(screen.getByText(/This is a controlled simulation/)).toBeTruthy();
  });

  it("provides visible, contrasting CTAs with the correct routes", () => {
    render(<Home />);
    const primary = screen.getByRole("link", { name:"See Rule Zero in Action" });
    const secondary = screen.getByRole("link", { name:"Explore Security Lab" });
    expect(primary.getAttribute("href")).toBe("/demo");
    expect(secondary.getAttribute("href")).toBe("/demo/shopping");
    expect(primary.className).toContain("bg-emerald-300");
    expect(primary.className).toContain("text-zinc-950");
    expect(primary.className).toContain("hover:bg-emerald-200");
    expect(primary.className).toContain("focus-visible:outline");
    expect(primary.className).toContain("disabled:text-zinc-300");
    expect(secondary.className).toContain("text-zinc-100");
  });

  it("uses three plain-language steps", () => {
    render(<Home />);
    expect(screen.getByRole("heading", {name:"Agent proposes"})).toBeTruthy();
    expect(screen.getByRole("heading", {name:"Rule Zero checks"})).toBeTruthy();
    expect(screen.getByRole("heading", {name:"Safe action continues"})).toBeTruthy();
    expect(screen.queryByText(/Phase 2|typed boundary|HMAC-linked|schema version/)).toBeNull();
  });
});
