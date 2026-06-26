/**
 * Liveness endpoint. Referenced as the `status` relation in the API catalog
 * (/.well-known/api-catalog) so agents can probe service health.
 */
export const dynamic = "force-dynamic";

export const GET = () =>
  Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
