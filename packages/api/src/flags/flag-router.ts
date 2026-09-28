import { openapi } from "@orpc/openapi";
import { z } from "zod";

import { publicProcedure } from "../orpc";
import { flagDefaults } from "./flags";

/** Derived from the registry, so a new flag reaches `/openapi.json` and typed
 * clients without a second declaration to keep in step. */
const flagOutput = z.object({
  flags: z.object(Object.fromEntries(Object.keys(flagDefaults).map((name) => [name, z.boolean()]))),
});

export const flagRouter = {
  list: publicProcedure
    .meta(
      openapi({
        description:
          "Returns every feature flag and whether it is enabled for this deployment. Resolved from FEATURE_FLAGS at startup, so the answer is per-environment and changes only on redeploy. Public, because flags gate UI as well as server behaviour — never put a secret behind a flag name.",
        summary: "List feature flags",
        tags: ["Flag"],
      }),
    )
    .output(flagOutput)
    .handler(({ context }) => ({ flags: context.flags })),
};
