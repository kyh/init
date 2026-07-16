import { authMetadataSchema } from "../auth/auth-schema";
import { createTRPCRouter, organizationProcedure } from "../trpc";

export const organizationRouter = createTRPCRouter({
  get: organizationProcedure.query(async ({ ctx }) => {
    const { organization, membership: currentUserMember } = ctx;

    // Independent of each other, and organizationProcedure has already proven
    // membership — so overlap them rather than paying two round trips.
    const [members, invitations] = await Promise.all([
      ctx.db.query.member.findMany({
        where: (member, { eq }) => eq(member.organizationId, organization.id),
        with: {
          // Allow-list only — full rows include admin-only fields (role, banned, banReason)
          user: { columns: { id: true, name: true, email: true, image: true } },
        },
      }),
      ctx.db.query.invitation.findMany({
        where: (invitation, { and, eq, ne }) =>
          and(eq(invitation.organizationId, organization.id), ne(invitation.status, "canceled")),
      }),
    ]);

    return {
      currentUserMember,
      organization,
      organizationMetadata: authMetadataSchema.parse(organization.metadata ?? "{}"),
      members,
      invitations,
    };
  }),
});
