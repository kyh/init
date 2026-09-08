"use client";

import { useMemo } from "react";
import { alertDialog } from "@repo/ui/components/alert-dialog";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Badge } from "@repo/ui/components/badge";
import {
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@repo/ui/components/dropdown-menu";
import { AutoTable, autoTableFeatures } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTable } from "@tanstack/react-table";

import type { RouterOutputs } from "@repo/api";
import type { AutoTableFeatures } from "@repo/ui/components/table";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { hasPermission, ROLES, roleSchema } from "@repo/api/auth/permissions";
import { TableRowActions } from "@/app/(dashboard)/dashboard/[slug]/_components/table-row-actions";
import {
  invalidateOrganization,
  useOrganization,
} from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

type MemberWithUser = RouterOutputs["organization"]["get"]["members"][number];

const getDisplayName = (member: MemberWithUser) =>
  member.user?.name ?? member.user?.email ?? "Unknown";

const useUpdateMemberRole = (slug: string, memberId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newRole: string) =>
      authClient.organization.updateMemberRole({
        fetchOptions: { throw: true },
        memberId,
        role: roleSchema.parse(newRole),
      }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Member role updated successfully");
      return invalidateOrganization(queryClient, slug);
    },
  });
};

const useRemoveMember = (slug: string, memberId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      authClient.organization.removeMember({
        fetchOptions: { throw: true },
        memberIdOrEmail: memberId,
      }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Member removed successfully");
      return invalidateOrganization(queryClient, slug);
    },
  });
};

const ActionsDropdown = ({
  slug,
  member,
  userId,
  canManageMembers,
}: {
  slug: string;
  member: MemberWithUser;
  userId: string;
  canManageMembers: boolean;
}) => {
  const isMemberSelf = member.userId === userId;
  const isMemberOwner = hasPermission(member.role, { organization: ["delete"] });
  const displayName = getDisplayName(member);

  const { mutateAsync: updateMemberRole } = useUpdateMemberRole(slug, member.id);
  const handleChangeRole = (newRole: string) => {
    alertDialog.open(`Change ${displayName}'s role?`, {
      action: {
        label: "Change",
        onClick: async () => {
          await updateMemberRole(newRole);
        },
      },
      description: `You are about to change ${displayName}'s role to ${newRole}. This may affect their permissions.`,
    });
  };

  const { mutateAsync: removeMember } = useRemoveMember(slug, member.id);
  const handleRemoveFromOrganization = () => {
    alertDialog.open(`Remove ${displayName} from the organization?`, {
      action: {
        label: "Remove",
        onClick: async () => {
          await removeMember();
        },
      },
      description: `You are about to remove ${displayName} from the organization. They will lose access to this organization.`,
    });
  };

  if (!canManageMembers) {
    return null;
  }

  const actions = [
    !isMemberSelf && (
      <DropdownMenuSub key="change-role">
        <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={member.role} onValueChange={handleChangeRole}>
            {ROLES.map((role) => (
              <DropdownMenuRadioItem key={role} value={role} className="capitalize">
                {role}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    ),
    !isMemberOwner && (
      <DropdownMenuItem key="remove-member" onClick={handleRemoveFromOrganization}>
        Remove from Organization
      </DropdownMenuItem>
    ),
  ].filter((action) => !!action);

  if (actions.length === 0) {
    return null;
  }

  return <TableRowActions>{actions}</TableRowActions>;
};

const createColumns = (
  slug: string,
  userId: string,
  canManageMembers: boolean,
): ColumnDef<AutoTableFeatures, MemberWithUser>[] => [
  {
    cell: ({ row }) => {
      const member = row.original;
      const displayName = getDisplayName(member);
      const isSelf = member.userId === userId;

      return (
        <span className="flex items-center gap-4 text-left">
          <Avatar className="size-9">
            <AvatarFallback className="animate-in fade-in uppercase">
              {displayName?.slice(0, 1)}
            </AvatarFallback>
          </Avatar>
          <span>{displayName}</span>
          {isSelf && <Badge variant="outline">You</Badge>}
        </span>
      );
    },
    header: "Name",
  },
  {
    cell: ({ row }) => {
      const member = row.original;
      return member.user?.email;
    },
    header: "Email",
  },
  {
    cell: ({ row }) => <Badge className="capitalize">{row.original.role}</Badge>,
    header: "Role",
  },
  {
    cell: ({ row }) => formatDate(row.original.createdAt),
    header: "Joined at",
  },
  {
    cell: ({ row }) => (
      <ActionsDropdown
        slug={slug}
        member={row.original}
        userId={userId}
        canManageMembers={canManageMembers}
      />
    ),
    header: "",
    id: "actions",
  },
];

interface MembersTableProps {
  slug: string;
}

export const MembersTable = ({ slug }: MembersTableProps) => {
  const { data: organizationData } = useOrganization(slug);
  const { userId } = organizationData.currentUserMember;
  const canManageMembers = hasPermission(organizationData.currentUserMember.role, {
    member: ["update", "delete"],
  });

  const columns = useMemo(
    () => createColumns(slug, userId, canManageMembers),
    [slug, userId, canManageMembers],
  );

  const table = useTable({
    columns,
    data: organizationData.members,
    features: autoTableFeatures,
  });

  return (
    <div className="rounded-md border">
      <AutoTable table={table} />
    </div>
  );
};
