import { waitlist } from "@repo/db/drizzle-schema";
import { openapi } from "@orpc/openapi";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { publicBase } from "../base";
import { joinWaitlistInput } from "./waitlist-schema";

export const waitlistContract = {
  join: publicBase
    .meta(
      openapi({
        description:
          "Adds an email address to the waitlist; no session needed. A signed-in caller's user id is recorded with it. Joining again with the same email is a no-op that returns `waitlist: null`.",
        summary: "Join the waitlist",
        tags: ["Waitlist"],
      }),
    )
    .input(joinWaitlistInput)
    .output(z.object({ waitlist: createSelectSchema(waitlist).nullable() })),
};
