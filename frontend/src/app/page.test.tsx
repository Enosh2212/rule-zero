// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import Home from "./page";

afterEach(cleanup);
describe("landing page", () => {
  it("provides the evaluator routes and accurate MVP language", () => {
    render(<Home />);
    expect(screen.getByRole("link", { name:"Launch Guided Demo" }).getAttribute("href")).toBe("/demo");
    expect(screen.getByRole("link", { name:"Open Security Lab" }).getAttribute("href")).toBe("/demo/shopping");
    expect(screen.getByText("A pre-action security layer for autonomous AI agents.")).toBeTruthy();
    expect(screen.getByText(/No real purchase, payment, navigation/)).toBeTruthy();
  });
});
