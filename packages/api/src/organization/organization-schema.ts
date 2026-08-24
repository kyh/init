import { z } from "zod";

/** The org slug every organization-scoped procedure is keyed by. */
export const organizationInput = z.object({
  slug: z.string().min(1, "Organization slug is required"),
});
