import type { User } from "better-auth";
import type { Invitation, Member, Organization } from "better-auth/plugins";
import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { authClient } from "@/auth/auth-client";
import { useTRPCClient } from "@/trpc/react";

export type MemberWithUser = Member & { user: User };

export type OrganizationWithMembers = Organization & {
  members: MemberWithUser[];
  invitations: Invitation[];
};

export const getOrganizationQueryKey = (slug: string) => ["organization", slug];

export const useOrganization = (slug: string) => {
  const trpcClient = useTRPCClient();
  const queryKey = getOrganizationQueryKey(slug);

  const { data } = useSuspenseQuery<OrganizationWithMembers>({
    queryKey,
    queryFn: async () => {
      const { data: organization } =
        await authClient.organization.getFullOrganization({
          query: {
            organizationSlug: slug,
          },
        });

      const { users: memberUsers } =
        await trpcClient.organization.listMemberUser.query({
          userIds: organization?.members.map((member) => member.userId) ?? [],
        });

      if (!organization) {
        throw new Error("Organization not found");
      }

      return processOrganization(organization, memberUsers);
    },
  });

  const memoizedData = useMemo(() => data, [data]);

  return { data: memoizedData, queryKey };
};

const processOrganization = (
  organization: Organization & {
    members: Member[];
    invitations: Invitation[];
  },
  memberUsers: User[],
): OrganizationWithMembers => {
  const usersMap = new Map(memberUsers.map((user) => [user.id, user]));
  const members = organization.members.map((member) => ({
    ...member,
    user: usersMap.get(member.userId)!,
  }));

  return {
    ...organization,
    members,
    invitations: organization.invitations.filter(
      (invitation) => invitation.status !== "canceled",
    ),
  };
};
