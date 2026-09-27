import { jsonError } from "@/orpc/request";

/** API clients parse JSON, so unknown /api paths must not fall through to the HTML 404 page. */
const notFound = () =>
  jsonError(404, "NOT_FOUND", "No API route matches this path. See /openapi.json.");

export {
  notFound as DELETE,
  notFound as GET,
  notFound as PATCH,
  notFound as POST,
  notFound as PUT,
};
