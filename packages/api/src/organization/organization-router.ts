import * as authSchema from "@repo/db/drizzle-schema-auth";
import { openapi } from "@orpc/openapi";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { authMetadata, authMetadataSchema } from "../auth/auth-schema";
import { organizationProcedure } from "../orpc";
import { organizationInput } from "./organization-schema";

const memberRow = createSelectSchema(authSchema.member);

const organizationOutput = z.object({
  currentUserMember: memberRow,
  invitations: z.array(createSelectSchema(authSchema.invitation)),
  members: z.array(
    memberRow.extend({
      user: createSelectSchema(authSchema.user)
        .pick({ email: true, id: true, image: true, name: true })
        .nullable(),
    }),
  ),
  organization: createSelectSchema(authSchema.organization),
  organizationMetadata: authMetadata,
});

export const organizationRouter = {
  get: organizationProcedure(organizationInput)
    .meta(
      openapi({
        description:
          "Returns the organization named by `slug` with its members (public profile fields only), its pending and accepted invitations, and the caller's own membership. The caller must be a member.",
        summary: "Get an organization",
        tags: ["Organization"],
      }),
    )
    .output(organizationOutput)
    .handler(async ({ context }) => {
      const { organization, membership: currentUserMember } = context;

      const [members, invitations] = await Promise.all([
        context.db.query.member.findMany({
          where: { organizationId: organization.id },
          with: {
            // Exclude admin-only user fields from the member response.
            user: { columns: { email: true, id: true, image: true, name: true } },
          },
        }),
        context.db.query.invitation.findMany({
          where: { organizationId: organization.id, status: { ne: "canceled" } },
        }),
      ]);

      return {
        currentUserMember,
        invitations,
        members,
        organization,
        organizationMetadata: authMetadataSchema.parse(organization.metadata ?? "{}"),
      };
    }),
};
