import { waitlist } from "@repo/db/drizzle-schema";

import { os } from "../orpc";

export const waitlistRouter = os.waitlist.router({
  join: os.waitlist.join.handler(async ({ context, input }) => {
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
});
