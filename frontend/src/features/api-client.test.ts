// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { requestJson } from "./api-client";

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("requestJson", () => {
  it("returns typed JSON for a successful response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status:"ok" }) }));
    await expect(requestJson<{status:string}>("/health", undefined, "Health failed")).resolves.toEqual({status:"ok"});
  });

  it("aborts a request after the configured timeout", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url:string, init?:RequestInit) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const pending = requestJson("/slow", undefined, "Slow request failed");
    const rejection = expect(pending).rejects.toThrow("request timed out");
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
  });
});
