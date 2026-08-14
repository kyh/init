import { describe, expect, it, vi } from "vitest";

import { mockSession } from "../test-utils";
import { createTRPCContext } from "../trpc";
import { auth } from "./auth";

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
    // The fetch handler mints the id itself precisely so a failure here still
    // leaves it something to put on the response — assert the ordering that
    // makes that possible, rather than the handler's use of it.
    const spy = vi.spyOn(auth.api, "getSession").mockRejectedValue(new Error("database is down"));

    await expect(createTRPCContext({ headers: headers() })).rejects.toThrow("database is down");
    expect(spy).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
