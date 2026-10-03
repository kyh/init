/**
 * One JSON line per oRPC call, tagged with the id the response carries as
 * `x-request-id`: grep a failed call's id to find its server-side record.
 */
import { randomUUID } from "node:crypto";

export const REQUEST_ID_HEADER = "x-request-id";

/** Ids are echoed into logs and headers, so an inbound one is reused only when it
 * is a plain token. Anything else gets a fresh id. */
const SAFE_REQUEST_ID = /^[\w.-]{1,128}$/u;

/** Reuses the caller's id, so a trace started by a proxy or an agent survives. */
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

/** The production sink on `context.log`; tests swap in their own. Failures go to
 * stderr so a log drain can split streams without parsing. */
export const logRequest = (record: RequestLogRecord): void => {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...record });
  if (record.ok) {
    console.log(line);
  } else {
    console.error(line);
  }
};
