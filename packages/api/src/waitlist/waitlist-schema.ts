import { waitlist } from "@repo/db/drizzle-schema";
import { createInsertSchema } from "drizzle-zod";

export const joinWaitlistInput = createInsertSchema(waitlist);
