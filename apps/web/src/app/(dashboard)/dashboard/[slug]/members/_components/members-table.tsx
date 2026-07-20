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
import { AutoTable } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import type { RouterOutputs } from "@repo/api";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { useTRPC } from "@/trpc/react";
import {
  hasPermission,
  ROLES,
  roleSchema,
} from "@/app/(dashboard)/dashboard/[slug]/_components/role";
import { TableRowActions } from "@/app/(dashboard)/dashboard/[slug]/_components/table-row-actions";
import { useOrganization } from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

type MemberWithUser = RouterOutputs["organization"]["get"]["members"][number];

type MembersTableProps = {
  slug: string;
};

export const MembersTable = ({ slug }: MembersTableProps) => {
  const { data: organizationData } = useOrganization(slug);
  const userId = organizationData.currentUserMember.userId;
  const canManageMembers = hasPermission(organizationData.currentUserMember.role, {
    member: ["update", "delete"],
  });

  const columns = useMemo(() => {
    const columnDefs: ColumnDef<MemberWithUser>[] = [
      {
        header: "Name",
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
      },
      {
        header: "Email",
        cell: ({ row }) => {
          const member = row.original;
          return member.user?.email;
        },
      },
      {
        header: "Role",
        cell: ({ row }) => <Badge className="capitalize">{row.original.role}</Badge>,
      },
      {
        header: "Joined at",
        cell: ({ row }) => formatDate(row.original.createdAt),
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionsDropdown
            slug={slug}
            member={row.original}
            userId={userId}
            canManageMembers={canManageMembers}
          />
        ),
      },
    ];

    return columnDefs;
  }, [slug, userId, canManageMembers]);

  const table = useReactTable({
    data: organizationData.members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <AutoTable table={table} />
    </div>
  );
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
  // Only the owner role can delete the organization (see permissions.ts) —
  // used here as an "is this member the owner" check, since better-auth's
  // access control models permissions, not role identity.
  const isMemberOwner = hasPermission(member.role, { organization: ["delete"] });
  const displayName = getDisplayName(member);

  const { mutateAsync: updateMemberRole } = useUpdateMemberRole(slug, member.id);
  const handleChangeRole = (newRole: string) => {
    alertDialog.open(`Change ${displayName}'s role?`, {
      description: `You are about to change ${displayName}'s role to ${newRole}. This may affect their permissions.`,
      action: {
        label: "Change",
        onClick: () => updateMemberRole(newRole),
      },
    });
  };

  const { mutateAsync: removeMember } = useRemoveMember(slug, member.id);
  const handleRemoveFromOrganization = () => {
    alertDialog.open(`Remove ${displayName} from the organization?`, {
      description: `You are about to remove ${displayName} from the organization. They will lose access to this organization.`,
      action: {
        label: "Remove",
        onClick: removeMember,
      },
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
      <DropdownMenuItem key="remove-member" onSelect={handleRemoveFromOrganization}>
        Remove from Organization
      </DropdownMenuItem>
    ),
  ].filter((action) => !!action);

  if (actions.length === 0) {
    return null;
  }

  return <TableRowActions>{actions}</TableRowActions>;
};

const getDisplayName = (member: MemberWithUser) => {
  return member.user?.name ?? member.user?.email ?? "Unknown";
};

const useUpdateMemberRole = (slug: string, memberId: string) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async (newRole: string) => {
      await authClient.organization.updateMemberRole({
        memberId,
        role: roleSchema.parse(newRole),
      });
    },
    onSuccess: () => {
      toast.success("Member role updated successfully");
      return queryClient.invalidateQueries(trpc.organization.get.queryFilter({ slug }));
    },
    onError: (error) => toast.error(error.message),
  });
};

const useRemoveMember = (slug: string, memberId: string) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async () => {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });
    },
    onSuccess: () => {
      toast.success("Member removed successfully");
      return queryClient.invalidateQueries(trpc.organization.get.queryFilter({ slug }));
    },
    onError: (error) => toast.error(error.message),
  });
};
