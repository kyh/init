import { appRouter } from "@repo/service";
import type { OpenAPIV3_2 } from "@orpc/openapi";
import { OpenAPIGenerator } from "@orpc/openapi";
import { ZodToJsonSchemaConverter } from "@orpc/zod";

import { siteConfig } from "@/lib/site-config";

export const OPENAPI_PREFIX = "/api/v1";

/** Sunset overlap promised by the versioning policy in the API docs. */
export const DEPRECATION_OVERLAP_DAYS = 90;

// The Zod converter represents Date outputs as date-time strings; the default one drops them.
const generator = new OpenAPIGenerator({ converters: [new ZodToJsonSchemaConverter()] });

const errorRef = { $ref: "#/components/schemas/Error" };

const errorResponse = (description: string) => ({
  content: { "application/json": { schema: errorRef } },
  description,
});

/** The route, not the procedure, sends these, so the generator cannot see them. */
const withRouteResponses = (
  operation: OpenAPIV3_2.OperationObject,
): OpenAPIV3_2.OperationObject => ({
  ...operation,
  responses: {
    ...operation.responses,
    403: errorResponse("A browser request from another origin (`FORBIDDEN`)."),
    500: errorResponse("An unexpected server fault (`INTERNAL_SERVER_ERROR`)."),
  },
});

const httpMethods: ("delete" | "get" | "patch" | "post" | "put")[] = [
  "delete",
  "get",
  "patch",
  "post",
  "put",
];

const description = `The ${siteConfig.name} app API: the same procedures the app's own clients call, served as JSON over HTTP.

Every operation is a \`POST\` with a JSON body. Every error is a JSON \`Error\` object with a machine-readable \`code\`.

**Authentication.** Operations marked with the \`session\` scheme need a first-party better-auth session cookie, obtained by signing in (\`POST /api/auth/sign-in/email\`, or GitHub sign-in in the app). There are no API keys, OAuth clients, or scopes; \`waitlist.join\` is public. Browser requests from other origins are refused.

**Versioning.** v1 is stable: it only gains backward-compatible changes (new operations, new optional input fields, new output fields). A breaking change ships as \`/api/v2\`, and v1 keeps serving for at least ${DEPRECATION_OVERLAP_DAYS} days afterwards. During that overlap v1 responses carry \`Deprecation\` (RFC 9745) and \`Sunset\` (RFC 8594) headers with a \`Link\` to the migration guide.`;

export const generateOpenAPIDocument = async () => {
  const document = await generator.generate(appRouter, {
    base: {
      components: {
        schemas: {
          Error: {
            description:
              "Every error body, from a procedure or from the route in front of it. Branch on `code`; `message` is for humans.",
            properties: {
              code: {
                description: "Stable machine-readable code, e.g. `UNAUTHORIZED` or `NOT_FOUND`.",
                type: "string",
              },
              data: { description: "Extra detail some errors carry." },
              defined: {
                description:
                  "True when the operation declares this code, so its shape is documented on the operation.",
                type: "boolean",
              },
              message: { description: "Human-readable explanation.", type: "string" },
            },
            required: ["code", "defined", "message"],
            type: "object",
          },
        },
        securitySchemes: {
          session: {
            description:
              "First-party better-auth session cookie, set by signing in (`POST /api/auth/sign-in/email`, or GitHub sign-in in the app). Not OAuth: there are no API keys, clients, or scopes.",
            in: "cookie",
            // better-auth prefixes the cookie only when the app is served over HTTPS.
            name: `${siteConfig.url.startsWith("https://") ? "__Secure-" : ""}better-auth.session_token`,
            type: "apiKey",
          },
        },
      },
      externalDocs: { description: "API guide", url: `${siteConfig.url}/docs/architecture/api` },
      info: {
        contact: { email: siteConfig.email, url: `${siteConfig.url}/contact` },
        description,
        license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
        termsOfService: `${siteConfig.url}/terms`,
        title: `${siteConfig.name} API`,
        version: "1.0.0",
        "x-api-lifecycle": {
          deprecationPolicy: `Breaking changes ship as a new major version at /api/v2. The previous version keeps serving for at least ${DEPRECATION_OVERLAP_DAYS} days, and its responses carry Deprecation (RFC 9745) and Sunset (RFC 8594) headers during that time.`,
          status: "stable",
          version: "v1",
        },
      },
      servers: [{ url: `${siteConfig.url}${OPENAPI_PREFIX}` }],
      tags: [
        {
          description: "The caller's organizations and their membership.",
          name: "Organization",
        },
        { description: "Example CRUD scoped to an organization.", name: "Todo" },
        { description: "Pre-launch email signups; public.", name: "Waitlist" },
      ],
    },
    // Every status shares one error shape; this narrows `code` to what the operation declares.
    customErrorResponseBodySchema: (definedErrors) => ({
      allOf: [errorRef],
      properties: { code: { enum: definedErrors.map(({ code }) => code) } },
    }),
    // The generator builds 3.2 and downgrades to the version asked for.
    version: "3.1.1",
  });

  if (document.components?.schemas) {
    // oRPC registers this for its own error shape, which customErrorResponseBodySchema replaces.
    document.components.schemas = Object.fromEntries(
      Object.entries(document.components.schemas).filter(([name]) => name !== "UndefinedError"),
    );
  }

  for (const item of Object.values(document.paths ?? {})) {
    for (const method of httpMethods) {
      const operation = item[method];
      if (operation) {
        item[method] = withRouteResponses(operation);
      }
    }
  }

  return document;
};
