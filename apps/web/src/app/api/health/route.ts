import { connection } from "next/server";

// Liveness answers per request, never from a build-time prerender.
export const GET = async () => {
  await connection();
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
};
