import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { z } from "zod";

/** Shared server/client role policy: extend better-auth permissions with organization billing. */
const statement = {
  ...defaultStatements,
  billing: ["manage"],
} as const;

export const ac = createAccessControl(statement);

export const owner = ac.newRole({
  ...ownerAc.statements,
  billing: ["manage"],
});

export const admin = ac.newRole({
  ...adminAc.statements,
  billing: ["manage"],
});

export const member = ac.newRole({
  ...memberAc.statements,
  billing: [],
});

export const roles = { owner, admin, member };

// Parse database role strings before permission checks.
export const roleSchema = z.enum(["owner", "admin", "member"], {
  error: "Select a role",
});
export type Role = z.infer<typeof roleSchema>;
export const ROLES: readonly Role[] = roleSchema.options;

/** Unknown roles fail closed. */
export const hasPermission = (
  role: string | null | undefined,
  permissions: Parameters<(typeof roles)["owner"]["authorize"]>[0],
): boolean => {
  const parsed = roleSchema.safeParse(role);
  return parsed.success && roles[parsed.data].authorize(permissions).success;
};
