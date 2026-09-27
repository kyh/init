import { appRouter } from "@repo/api";
import { OpenAPIGenerator } from "@orpc/openapi";

import { siteConfig } from "@/lib/site-config";

export const OPENAPI_PREFIX = "/api/v1";

/** Zod schemas convert through Standard JSON Schema, which oRPC applies by default. */
const generator = new OpenAPIGenerator();

export const generateOpenAPIDocument = () =>
  generator.generate(appRouter, {
    base: {
      components: {
        securitySchemes: {
          session: {
            description:
              "better-auth session cookie; `__Secure-` prefixed over HTTPS. Obtain one from POST /api/auth/sign-in/email.",
            in: "cookie",
            name: "better-auth.session_token",
            type: "apiKey",
          },
        },
      },
      info: {
        contact: { email: siteConfig.email, url: `${siteConfig.url}/contact` },
        description: `The ${siteConfig.name} app API. Organization and todo procedures need a signed-in session; waitlist.join is public.`,
        license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
        title: `${siteConfig.name} API`,
        version: "1.0.0",
      },
      openapi: "3.1.1",
      // An empty requirement keeps the session optional, since waitlist.join is public.
      security: [{ session: [] }, {}],
      servers: [{ url: `${siteConfig.url}${OPENAPI_PREFIX}` }],
    },
  });
