import { siteConfig } from "@/lib/site-config";

/**
 * API catalog for automated discovery (RFC 9727), serialized as a linkset
 * (RFC 9264) with media type application/linkset+json.
 *
 * The anchor is the oRPC API surface. We advertise human docs (service-doc) and
 * a health endpoint (status). We intentionally omit `service-desc`: the RPC
 * handler publishes no OpenAPI document. Add it here if/when one is published.
 */
export const GET = () => {
  const linkset = {
    linkset: [
      {
        anchor: `${siteConfig.url}/api/orpc`,
        "service-doc": [
          {
            href: `${siteConfig.url}/docs/architecture/api`,
            type: "text/html",
            title: "API documentation",
          },
        ],
        status: [{ href: `${siteConfig.url}/api/health` }],
      },
    ],
  };

  return new Response(JSON.stringify(linkset, null, 2), {
    headers: { "Content-Type": "application/linkset+json" },
  });
};
