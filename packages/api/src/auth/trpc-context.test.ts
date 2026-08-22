import { describe, expect, it, vi } from "vitest";

import { mockSession } from "../test-utils";
import { createTRPCContext } from "../trpc";
import { auth } from "./auth";

// Wrapped, not stubbed: the real implementation still runs, but the call is
// recorded so the ordering test below can compare invocation order against the
// session lookup.
vi.mock("../observability/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../observability/logger")>();
  return { ...actual, resolveRequestId: vi.fn(actual.resolveRequestId) };
});

const { resolveRequestId } = await import("../observability/logger");

const headers = () => new Headers();

describe("createTRPCContext", () => {
  it("resolves the session itself when none is supplied", async () => {
    const spy = vi.spyOn(auth.api, "getSession").mockResolvedValue(mockSession);

    const ctx = await createTRPCContext({ headers: headers() });

    expect(ctx.session).toBe(mockSession);
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });

  it("reuses a supplied session instead of looking it up again", async () => {
    const spy = vi.spyOn(auth.api, "getSession");

    const ctx = await createTRPCContext({ headers: headers(), session: mockSession });

    expect(ctx.session).toBe(mockSession);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("treats a supplied null as resolved-and-logged-out, not as absent", async () => {
    const spy = vi.spyOn(auth.api, "getSession");

    const ctx = await createTRPCContext({ headers: headers(), session: null });

    expect(ctx.session).toBeNull();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("reuses a request id supplied by the caller", async () => {
    const ctx = await createTRPCContext({
      headers: headers(),
      session: null,
      requestId: "from-the-handler",
    });

    expect(ctx.requestId).toBe("from-the-handler");
  });

  it("resolves the request id before the session lookup, which can throw", async () => {
    // Asserting only that the rejection propagates would pass even if the id
    // were resolved after the lookup, which is the ordering that matters — so
    // compare when each was actually called.
    const resolved = vi.mocked(resolveRequestId);
    resolved.mockClear();
    const spy = vi.spyOn(auth.api, "getSession").mockRejectedValue(new Error("database is down"));

    await expect(createTRPCContext({ headers: headers() })).rejects.toThrow("database is down");

    const resolvedAt = resolved.mock.invocationCallOrder[0];
    const lookedUpAt = spy.mock.invocationCallOrder[0];
    expect(resolvedAt).toBeDefined();
    expect(lookedUpAt).toBeDefined();
    expect(resolvedAt ?? 0).toBeLessThan(lookedUpAt ?? 0);

    spy.mockRestore();
  });

  it("does not re-resolve an id the caller supplied", async () => {
    const resolved = vi.mocked(resolveRequestId);
    resolved.mockClear();

    await createTRPCContext({ headers: headers(), session: null, requestId: "given" });

    expect(resolved).not.toHaveBeenCalled();
  });
});
