import { afterEach, describe, expect, it, vi } from "vitest";

import { logRequest, REQUEST_ID_HEADER, resolveRequestId } from "./logger";

const headersWith = (id: string) => new Headers({ [REQUEST_ID_HEADER]: id });

describe("resolveRequestId", () => {
  it("reuses a well-formed inbound id so an external trace survives", () => {
    expect(resolveRequestId(headersWith("abc-123_XY.z"))).toBe("abc-123_XY.z");
  });

  it("mints one when the header is absent", () => {
    const id = resolveRequestId(new Headers());

    expect(id).toMatch(/^[0-9a-f-]{36}$/);
  });

  // Newlines can't be tested here: `Headers` rejects them at construction, which
  // is the point — the regex covers what does get through.
  it("rejects an id carrying characters that would muddle a log line", () => {
    for (const hostile of ["with space", "semi;colon", '"quoted"', "brace{}"]) {
      expect(resolveRequestId(headersWith(hostile))).not.toBe(hostile);
    }
  });

  it("rejects an over-long id", () => {
    const tooLong = "a".repeat(129);

    expect(resolveRequestId(headersWith(tooLong))).not.toBe(tooLong);
  });
});

describe("logRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const record = {
    requestId: "req-1",
    type: "query",
    path: "todo.list",
    durationMs: 12,
    ok: true,
  } as const;

  it("stays silent under vitest so procedure tests aren't drowned in log lines", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logRequest(record);

    expect(log).not.toHaveBeenCalled();
  });

  it("writes one parseable JSON line with a timestamp", () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);

    logRequest(record);

    expect(log).toHaveBeenCalledOnce();
    const line = log.mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    expect(JSON.parse(String(line))).toMatchObject({ ...record, ts: expect.any(String) });
  });

  it("sends failures to stderr so a drain can split streams without parsing", () => {
    vi.stubEnv("NODE_ENV", "production");
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    logRequest({ ...record, ok: false, code: "UNAUTHORIZED" });

    expect(log).not.toHaveBeenCalled();
    expect(error).toHaveBeenCalledOnce();
    expect(JSON.parse(String(error.mock.calls[0]?.[0]))).toMatchObject({
      ok: false,
      code: "UNAUTHORIZED",
    });
  });
});
