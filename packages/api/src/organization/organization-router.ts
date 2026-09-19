import { authMetadataSchema } from "../auth/auth-schema";
import { organizationProcedure } from "../orpc";
import { organizationInput } from "./organization-schema";

export const organizationRouter = {
  get: organizationProcedure(organizationInput).handler(async ({ context }) => {
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
