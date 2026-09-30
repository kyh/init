import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { z } from "zod";

import { generateOpenAPIDocument } from "./openapi";

const ERROR_REF = "#/components/schemas/Error";

const jsonContent = z.object({
  "application/json": z.object({ schema: z.record(z.string(), z.unknown()) }),
});

const errorSchema = z.union([
  z.object({ $ref: z.literal(ERROR_REF) }),
  z.object({ allOf: z.tuple([z.object({ $ref: z.literal(ERROR_REF) })]) }),
]);

const operationSchema = z.object({
  description: z.string().min(1),
  responses: z.record(z.string(), z.object({ content: jsonContent, description: z.string() })),
  security: z.array(z.record(z.string(), z.array(z.string()))).optional(),
  summary: z.string().min(1),
  tags: z.array(z.string()).min(1),
});

const documentSchema = z.object({
  components: z.object({
    schemas: z.record(z.string(), z.unknown()),
    securitySchemes: z.record(z.string(), z.unknown()),
  }),
  info: z.object({ "x-api-lifecycle": z.object({ deprecationPolicy: z.string().min(1) }) }),
  paths: z.record(z.string(), z.record(z.string(), operationSchema)),
});

// Parsed at module level: a throw inside an async describe is not reported as a failure.
// Parsing asserts every operation has a summary, description, tags and JSON responses.
const document = documentSchema.parse(await generateOpenAPIDocument());
const operations = Object.entries(document.paths).flatMap(([path, item]) =>
  Object.entries(item).map(([method, operation]) => ({ id: `${method} ${path}`, operation })),
);

describe("openapi document", () => {
  test("gives every operation a typed success schema", () => {
    for (const { id, operation } of operations) {
      const schema = operation.responses["200"]?.content["application/json"].schema;
      assert.equal(schema?.type, "object", `${id} has no typed 200 response`);
    }
  });

  test("points every error response at the shared Error schema", () => {
    assert.ok(document.components.schemas.Error);
    assert.equal(document.components.schemas.UndefinedError, undefined);
    for (const { id, operation } of operations) {
      const errors = Object.entries(operation.responses).filter(
        ([status]) => Number(status) >= 400,
      );
      for (const [status, response] of errors) {
        const parsed = errorSchema.safeParse(response.content["application/json"].schema);
        assert.ok(parsed.success, `${id} ${status} does not reference the Error schema`);
      }
    }
  });

  test("requires a declared scheme on every unsecured operation bar the public two", () => {
    const schemes = Object.keys(document.components.securitySchemes);
    const unsecured = operations
      .filter(({ operation }) => operation.security === undefined)
      .map(({ id }) => id);
    // Both are deliberately reachable without a session: the waitlist takes
    // signups before anyone has an account, and the flag set gates UI as well
    // as server behaviour, so an unauthenticated page needs to read it. Keep
    // this list exact — it is the tripwire for an endpoint going public by
    // accident, so never put a secret behind a flag name.
    assert.deepEqual(unsecured, ["post /flag/list", "post /waitlist/join"]);
    for (const { operation } of operations) {
      for (const requirement of operation.security ?? []) {
        for (const name of Object.keys(requirement)) {
          assert.ok(schemes.includes(name), `undeclared security scheme ${name}`);
        }
      }
    }
  });
});
