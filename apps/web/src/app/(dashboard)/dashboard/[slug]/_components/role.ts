import { z } from "zod";

export const roleSchema = z.enum(["owner", "admin", "member"], {
  error: "Select a role",
});

export type Role = z.infer<typeof roleSchema>;

export const ROLES: readonly Role[] = ["owner", "admin", "member"];
