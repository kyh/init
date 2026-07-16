import { waitlist } from "@repo/db/drizzle-schema";

import { env } from "../env";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { joinWaitlistInput } from "./waitlist-schema";

export const waitlistRouter = createTRPCRouter({
  join: publicProcedure.input(joinWaitlistInput).mutation(async ({ ctx, input }) => {
    const [created] = await ctx.db
      .insert(waitlist)
      .values({
        ...input,
        // Nullable column — store null when there's no deployment URL rather
        // than an empty string.
        source: env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
        userId: ctx.session?.user.id,
      })
      // Repeat signups are a no-op rather than an error (email is unique)
      .onConflictDoNothing({ target: waitlist.email })
      .returning();

    return {
      waitlist: created ?? null,
    };
  }),
});
