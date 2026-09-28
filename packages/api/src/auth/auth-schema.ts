import { z } from "zod";

export const authMetadata = z.object({
  personal: z.boolean().optional(),
});

export const authMetadataSchema = z
  .string()
  .transform((str, ctx): z.JSONType => {
    try {
      return JSON.parse(str);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });
      return z.NEVER;
    }
  })
  .pipe(authMetadata);
