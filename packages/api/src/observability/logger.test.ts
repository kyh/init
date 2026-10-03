import assert from "node:assert/strict";
import type { TestContext } from "node:test";
import { describe, test } from "node:test";

import type { RequestLogRecord } from "./logger";
import { logRequest, REQUEST_ID_HEADER, resolveRequestId } from "./logger";

/** Annotated rather than asserted: every check below fails loudly on a mismatch. */
const parseLine = (line: string): RequestLogRecord & { ts: string } => JSON.parse(line);

const headersWith = (id: string) => new Headers({ [REQUEST_ID_HEADER]: id });

const record = {
  durationMs: 12,
  ok: true,
  path: "todo.list",
  requestId: "req-1",
} as const;

/** Records what each console stream receives for the rest of the test. */
const capture = (t: TestContext) => {
  const streams: Record<"error" | "log", string[]> = { error: [], log: [] };
  t.mock.method(console, "log", (line: string) => streams.log.push(line));
  t.mock.method(console, "error", (line: string) => streams.error.push(line));
  return streams;
};

describe("resolveRequestId", () => {
  test("reuses a well-formed inbound id so an external trace survives", () => {
    assert.equal(resolveRequestId(headersWith("abc-123_XY.z")), "abc-123_XY.z");
  });

  test("mints one when the header is absent", () => {
    assert.match(resolveRequestId(new Headers()), /^[0-9a-f-]{36}$/u);
  });

  test("rejects an id carrying characters that would muddle a log line", () => {
    // Newlines cannot be tested here: Headers rejects them at construction,
    // which is the point — the pattern covers what does get through.
    for (const hostile of ["with space", "semi;colon", '"quoted"', "brace{}"]) {
      assert.notEqual(resolveRequestId(headersWith(hostile)), hostile);
    }
  });

  test("rejects an over-long id", () => {
    const tooLong = "a".repeat(129);

    assert.notEqual(resolveRequestId(headersWith(tooLong)), tooLong);
  });
});

describe("logRequest", () => {
  test("writes one parseable JSON line with a timestamp", (t) => {
    const streams = capture(t);
    logRequest(record);

    assert.deepEqual(streams.error, []);
    assert.equal(streams.log.length, 1);
    const parsed = parseLine(streams.log[0] ?? "");
    assert.equal(parsed.path, "todo.list");
    assert.equal(parsed.requestId, "req-1");
    assert.equal(parsed.ok, true);
    assert.match(parsed.ts, /^\d{4}-\d{2}-\d{2}T/u);
  });

  test("sends failures to stderr so a drain can split streams without parsing", (t) => {
    const streams = capture(t);
    logRequest({ ...record, code: "UNAUTHORIZED", ok: false });

    assert.deepEqual(streams.log, []);
    assert.equal(streams.error.length, 1);
    const parsed = parseLine(streams.error[0] ?? "");
    assert.equal(parsed.ok, false);
    assert.equal(parsed.code, "UNAUTHORIZED");
  });
});
