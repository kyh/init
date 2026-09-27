import { OPENAPI_PREFIX } from "@/orpc/openapi";
import { siteConfig } from "@/lib/site-config";

/**
 * API catalog for automated discovery (RFC 9727), serialized as a linkset
 * (RFC 9264) with media type application/linkset+json.
 *
 * The anchor is the REST view of the oRPC router. We advertise its OpenAPI
 * description (service-desc), human docs (service-doc) and a health endpoint
 * (status). The RPC transport at /api/orpc is the app's own client protocol.
 */
export const GET = () => {
  const linkset = {
    linkset: [
      {
        anchor: `${siteConfig.url}${OPENAPI_PREFIX}`,
        "service-desc": [
          {
            href: `${siteConfig.url}/openapi.json`,
            type: "application/openapi+json",
          },
        ],
        "service-doc": [
          {
            href: `${siteConfig.url}/docs/architecture/api`,
            title: "API documentation",
            type: "text/html",
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
