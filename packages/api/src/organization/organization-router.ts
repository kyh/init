import { authMetadataSchema } from "../auth/auth-schema";
import { createTRPCRouter, organizationProcedure } from "../trpc";

export const organizationRouter = createTRPCRouter({
  get: organizationProcedure.query(async ({ ctx }) => {
    const { organization, membership: currentUserMember } = ctx;

    const members = await ctx.db.query.member.findMany({
      where: (member, { eq }) => eq(member.organizationId, organization.id),
    });

    const invitations = await ctx.db.query.invitation.findMany({
      where: (invitation, { eq }) => eq(invitation.organizationId, organization.id),
    });
    const filteredInvitations = invitations.filter(
      (invitation) => invitation.status !== "canceled",
    );

    const memberUserIds = members.map((member) => member.userId);
    const memberUsers = await ctx.db.query.user.findMany({
      where: (user, { inArray }) => inArray(user.id, memberUserIds),
      // Allow-list only — full rows include admin-only fields (role, banned, banReason)
      columns: { id: true, name: true, email: true, image: true },
    });
    const memberUsersMap = new Map(memberUsers.map((user) => [user.id, user]));

    const membersWithUsers = members.map((member) =>
      Object.assign({}, member, { user: memberUsersMap.get(member.userId) }),
    );

    return {
      currentUserMember,
      organization,
      organizationMetadata: authMetadataSchema.parse(organization.metadata ?? "{}"),
      members: membersWithUsers,
      invitations: filteredInvitations,
    };
  }),
});
