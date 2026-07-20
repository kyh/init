import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  memberAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import { z } from "zod";

/**
 * Single source of truth for organization role policy — imported by both the
 * server (auth.ts, the `organization()` plugin) and the web client
 * (auth-client.ts, `organizationClient()`, and UI permission checks).
 *
 * Extends better-auth's default organization statements (org/member/
 * invitation/team management) with the one app-specific resource the UI
 * gates beyond those: Stripe billing (see `authorizeReference` below and
 * the billing dashboard page).
 */
const statement = {
  ...defaultStatements,
  billing: ["manage"],
} as const;

export const ac = createAccessControl(statement);

// Owners and admins keep better-auth's default org/member/invitation/team
// permissions and can additionally manage billing; members get neither.
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

// The three role names are exactly the keys of `roles` above. Kept as a zod
// schema (rather than derived at the type level from `roles`) so both the
// server and the web client can validate a raw `member.role` string (as
// stored in the database) into a role that `hasPermission` (below) can check.
export const roleSchema = z.enum(["owner", "admin", "member"], {
  error: "Select a role",
});
export type Role = z.infer<typeof roleSchema>;
export const ROLES: readonly Role[] = roleSchema.options;

/**
 * Whether `role` grants every listed permission. Built on `roles` above rather
 * than the auth client, so a server component, a client component, and the
 * mobile app all gate the same way. A role string outside ROLES (an unexpected
 * database value) yields false.
 */
export const hasPermission = (
  role: string | null | undefined,
  permissions: Parameters<(typeof roles)["owner"]["authorize"]>[0],
): boolean => {
  const parsed = roleSchema.safeParse(role);
  return parsed.success && roles[parsed.data].authorize(permissions).success;
};
