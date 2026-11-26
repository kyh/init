import { authMetadata } from "@repo/contract/organization/organization-schema";
import { z } from "zod";

export const authMetadataSchema = z
  .string()
  .transform((str, ctx) => {
    try {
      const parsed: unknown = JSON.parse(str);

      return parsed;
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid JSON" });

      return z.NEVER;
    }
  })
  .pipe(authMetadata);
