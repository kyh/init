/**
 * Structured request logging.
 *
 * Every oRPC call emits one JSON line on stdout, tagged with a request id that
 * also comes back on the HTTP response as `x-request-id`. That pairing is what
 * makes a run reconstructable after the fact: take the id off a failed response
 * and grep the server output for the single line describing it — path, duration,
 * outcome, and the user it ran as — instead of correlating by timestamp.
 *
 * One line per call, JSON, no dependencies: greppable in `pnpm dev:web` output
 * and parseable by whatever log drain production points at.
 */
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Ids are echoed into logs and response headers, so an inbound one is only
 * reused when it's a plain token — this stops a caller muddling either surface
 * with delimiters or padding it out. Anything else gets a fresh id.
 */
const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/u;

/**
 * Reuses the caller's `x-request-id` when there is one, so a trace started by a
 * proxy, a test harness, or an agent's own fetch survives into these logs.
 * Mints one otherwise.
 */
export const resolveRequestId = (headers: Headers): string => {
  const inbound = headers.get(REQUEST_ID_HEADER);
  return inbound && SAFE_REQUEST_ID.test(inbound) ? inbound : randomUUID();
};

export interface RequestLogRecord {
  /** oRPC error code, present only on failure. */
  code?: string;
  durationMs: number;
  ok: boolean;
  /** Dotted procedure path, e.g. `todo.create`. */
  path: string;
  requestId: string;
  /** Set when the call ran with a session. */
  userId?: string;
}

/**
 * True while a test runner is driving the process.
 *
 * Checked at call time, not at load, so a test can toggle it. Both signals are
 * needed: `node --test` sets `NODE_TEST_CONTEXT` but leaves `NODE_ENV` undefined
 * (unlike vitest, which sets `NODE_ENV=test`), and keying on `NODE_ENV` alone
 * would mean every procedure test in the suite spewed a JSON line into the
 * runner's output.
 */
const isTestRun = () =>
  process.env.NODE_ENV === "test" || process.env.NODE_TEST_CONTEXT !== undefined;

/**
 * Writes one record as a single JSON line. Failures go to stderr so a log drain
 * can split streams without parsing.
 *
 * Silent under a test runner: unit tests call procedures directly, and their
 * output is signal about the tests, not about a request.
 */
export const logRequest = (record: RequestLogRecord): void => {
  if (isTestRun()) {
    return;
  }

  const line = JSON.stringify({ ts: new Date().toISOString(), ...record });
  if (record.ok) {
    console.log(line);
  } else {
    console.error(line);
  }
};
