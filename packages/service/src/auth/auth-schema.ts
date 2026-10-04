import { authMetadata } from "@repo/contract/organization/organization-schema";
import { z } from "zod";

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
