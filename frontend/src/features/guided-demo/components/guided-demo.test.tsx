// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GuidedDemo } from "./guided-demo";

const snapshot = { schema_version:"1.0", products:[{product_id:"volt-mini-10k",category:"power_bank",price:1499,stock:8}], warranty_id:"extended-warranty", warranty_price:399, membership_id:"volt-plus", membership_monthly_price:199, supported_actions:[], state:{scenario_id:"shopping-trap",cart_items:[],addons:{warranty_enabled:false,membership_enabled:false},checkout_preview_reached:false,simulation_completed:false,state_version:0} };
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("GuidedDemo", () => {
  it("starts inert, renders semantic progress, and exposes no unsafe automation", () => {
    render(<GuidedDemo />);
    expect(screen.getByText(/Buy a power bank under ₹1,500/)).toBeTruthy();
    expect(screen.getByRole("button", {name:"Start Guided Demo"})).toBeTruthy();
    expect(screen.getByRole("list", {name:"Guided demo progress"}).children).toHaveLength(9);
    expect(screen.queryByText(/Run Everything|Auto Approve|Override Rule Zero/)).toBeNull();
    expect(screen.getByRole("link", {name:"Security Lab"}).getAttribute("href")).toBe("/demo/shopping");
  });
  it("requires an explicit start, loads backend state, and reset returns to mission", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ok:true,json:async()=>snapshot}));
    render(<GuidedDemo />);
    fireEvent.click(screen.getByRole("button", {name:"Start Guided Demo"}));
    expect(await screen.findByRole("button", {name:"Generate Safety Contract"})).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", {name:"Reset Guided Demo"}));
    expect(screen.getByRole("button", {name:"Start Guided Demo"})).toBeTruthy();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
  it("shows the failing stage and preserves manual retry semantics", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<GuidedDemo />);
    fireEvent.click(screen.getByRole("button", {name:"Start Guided Demo"}));
    expect((await screen.findByRole("alert")).textContent).toContain("Mission failed: offline");
    expect(screen.getByRole("button", {name:"Start Guided Demo"})).toBeTruthy();
  });
});
