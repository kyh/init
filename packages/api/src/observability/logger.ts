/**
 * Structured request logging.
 *
 * Every tRPC call emits one JSON line on stdout, tagged with a request id that
 * also comes back on the HTTP response as `x-request-id`. That pairing is what
 * makes a run reconstructable after the fact: an agent (or a human reading a
 * bug report) takes the id off a failed response and greps the server output
 * for the single line describing it — path, duration, outcome, and the user it
 * ran as — instead of correlating by timestamp.
 *
 * One line per call, JSON, no dependencies: it stays greppable in `pnpm dev:web`
 * output and parseable by whatever log drain you point at production.
 */
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Ids are echoed into logs and response headers, so an inbound one is only
 * reused when it's a plain token — this keeps a caller from muddling either
 * surface with delimiters or padding it out. Anything else gets a fresh id.
 */
const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/;

/**
 * Reuses the caller's `x-request-id` when there is one, so a trace started by a
 * proxy, a test harness, or an agent's own fetch survives into these logs.
 * Mints one otherwise.
 */
export const resolveRequestId = (headers: Headers): string => {
  const inbound = headers.get(REQUEST_ID_HEADER);
  return inbound && SAFE_REQUEST_ID.test(inbound) ? inbound : randomUUID();
};

export type RequestLogRecord = {
  requestId: string;
  type: "query" | "mutation" | "subscription";
  /** Dotted procedure path, e.g. `todo.create`. */
  path: string;
  durationMs: number;
  ok: boolean;
  /** tRPC error code, present only on failure. */
  code?: string;
  /** Set when the call ran with a session. */
  userId?: string;
};

/**
 * Writes one record as a single JSON line. Failures go to stderr so a log drain
 * can split streams without parsing.
 *
 * Silent under vitest: the unit tests call procedures directly, and their output
 * is signal about the tests, not about a request.
 */
export const logRequest = (record: RequestLogRecord): void => {
  if (process.env.NODE_ENV === "test") return;

  const line = JSON.stringify({ ts: new Date().toISOString(), ...record });
  if (record.ok) {
    console.log(line);
  } else {
    console.error(line);
  }
};
