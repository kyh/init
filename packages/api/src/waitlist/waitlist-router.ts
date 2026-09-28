import { waitlist } from "@repo/db/drizzle-schema";
import { openapi } from "@orpc/openapi";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { publicProcedure } from "../orpc";
import { joinWaitlistInput } from "./waitlist-schema";

export const waitlistRouter = {
  join: publicProcedure
    .meta(
      openapi({
        description:
          "Adds an email address to the waitlist; no session needed. A signed-in caller's user id is recorded with it. Joining again with the same email is a no-op that returns `waitlist: null`.",
        summary: "Join the waitlist",
        tags: ["Waitlist"],
      }),
    )
    .input(joinWaitlistInput)
    .output(z.object({ waitlist: createSelectSchema(waitlist).nullable() }))
    .handler(async ({ context, input }) => {
      const [created] = await context.db
        .insert(waitlist)
        .values({
          ...input,
          source: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? "",
          userId: context.session?.user.id,
        })
        // Repeat signups are a no-op rather than an error (email is unique)
        .onConflictDoNothing({ target: waitlist.email })
        .returning();

      return {
        waitlist: created ?? null,
      };
    }),
};
