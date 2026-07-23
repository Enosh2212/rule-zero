import { describe, expect, it } from "vitest";
import { canVisit, guidedReducer, initialGuidedState } from "./controller";

describe("guided controller", () => {
  it("gates later stages and permits completed-stage replay", () => {
    expect(canVisit(initialGuidedState, 2)).toBe(false);
    const started = guidedReducer(initialGuidedState, { type:"patch", value:{ started:true, completed:[1] } });
    expect(canVisit(started, 2)).toBe(true);
    expect(canVisit(started, 3)).toBe(false);
    const progressed = guidedReducer(started, { type:"patch", value:{ completed:[1,2,3] } });
    expect(canVisit(progressed, 2)).toBe(true);
    expect(canVisit(progressed, 4)).toBe(true);
  });
  it("reset removes every operational artifact", () => {
    const changed = guidedReducer(initialGuidedState, { type:"patch", value:{ started:true, completed:[1,2], error:"failed" } });
    expect(guidedReducer(changed, { type:"reset" })).toEqual(initialGuidedState);
  });
});
