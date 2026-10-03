import * as authSchema from "@repo/db/drizzle-schema-auth";
import { openapi } from "@orpc/openapi";
import { createSelectSchema } from "drizzle-orm/zod";
import { z } from "zod";

import { organizationBase } from "../base";
import { authMetadata, organizationInput } from "./organization-schema";

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

export const organizationContract = {
  get: organizationBase
    .meta(
      openapi({
        description:
          "Returns the organization named by `slug` with its members (public profile fields only), its pending and accepted invitations, and the caller's own membership. The caller must be a member.",
        summary: "Get an organization",
        tags: ["Organization"],
      }),
    )
    .input(organizationInput)
    .output(organizationOutput),
};
