import assert from "node:assert/strict";
import { describe, mock, test } from "node:test";

import { logRequest, REQUEST_ID_HEADER, resolveRequestId } from "./logger";

/** The shape logRequest writes. Declared so the assertions below read fields off
 * a contract rather than probing an untyped bag. */
interface LoggedLine {
  code?: string;
  durationMs: number;
  ok: boolean;
  path: string;
  requestId: string;
  ts: string;
  userId?: string;
}

/** JSON.parse yields `any`; the annotation is the contract, and every assertion
 * below would fail loudly if the real line did not match it. */
const parseLine = (line: string): LoggedLine => JSON.parse(line);

const headersWith = (id: string) => new Headers({ [REQUEST_ID_HEADER]: id });

const record = {
  durationMs: 12,
  ok: true,
  path: "todo.list",
  requestId: "req-1",
} as const;

/** Captures a console stream for one call, restoring it afterwards. */
const capture = (stream: "log" | "error", run: () => void) => {
  const lines: string[] = [];
  const spy = mock.method(console, stream, (line: string) => {
    lines.push(line);
  });
  try {
    run();
  } finally {
    spy.mock.restore();
  }
  return lines;
};

/**
 * Lifts the test-runner silence for one test. `node --test` sets
 * NODE_TEST_CONTEXT, which is what logRequest keys on, so removing it is how a
 * test observes the real output path.
 */
const enableLogging = () => {
  const context = process.env.NODE_TEST_CONTEXT;
  const nodeEnv = process.env.NODE_ENV;
  delete process.env.NODE_TEST_CONTEXT;
  process.env.NODE_ENV = "production";
  return () => {
    if (context === undefined) {
      delete process.env.NODE_TEST_CONTEXT;
    } else {
      process.env.NODE_TEST_CONTEXT = context;
    }
    if (nodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = nodeEnv;
    }
  };
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
  test("stays silent under the test runner so procedure tests aren't drowned", () => {
    assert.deepEqual(
      capture("log", () => {
        logRequest(record);
      }),
      [],
    );
  });

  test("writes one parseable JSON line with a timestamp", () => {
    const restore = enableLogging();
    try {
      const lines = capture("log", () => {
        logRequest(record);
      });

      assert.equal(lines.length, 1);
      const parsed = parseLine(lines[0] ?? "");
      assert.equal(parsed.path, "todo.list");
      assert.equal(parsed.requestId, "req-1");
      assert.equal(parsed.ok, true);
      assert.match(parsed.ts, /^\d{4}-\d{2}-\d{2}T/u);
    } finally {
      restore();
    }
  });

  test("sends failures to stderr so a drain can split streams without parsing", () => {
    const restore = enableLogging();
    try {
      const logged = capture("log", () => {
        const errored = capture("error", () => {
          logRequest({ ...record, code: "UNAUTHORIZED", ok: false });
        });
        assert.equal(errored.length, 1);
        const parsed = parseLine(errored[0] ?? "");
        assert.equal(parsed.ok, false);
        assert.equal(parsed.code, "UNAUTHORIZED");
      });

      assert.deepEqual(logged, []);
    } finally {
      restore();
    }
  });
});
