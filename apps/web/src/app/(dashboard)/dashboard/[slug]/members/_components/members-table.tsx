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
import { useMutation } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import type { RouterOutputs } from "@repo/api";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { TableRowActions } from "@/app/(dashboard)/dashboard/[slug]/_components/table-row-actions";
import { useOrganization } from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

type MemberWithUser = RouterOutputs["organization"]["get"]["members"][number];

type MembersTableProps = {
  slug: string;
};

export const MembersTable = ({ slug }: MembersTableProps) => {
  const { data: organizationData } = useOrganization(slug);
  const userId = organizationData.currentUserMember.userId;
  const userRole = organizationData.currentUserMember.role;

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
        cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionsDropdown member={row.original} userId={userId} userRole={userRole} />
        ),
      },
    ];

    return columnDefs;
  }, [userId, userRole]);

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
  member,
  userId,
  userRole,
}: {
  member: MemberWithUser;
  userId: string;
  userRole: string | undefined;
}) => {
  const isMemberSelf = member.userId === userId;
  const isMemberOwner = member.role === "owner";
  const displayName = getDisplayName(member);

  const { mutateAsync: updateMemberRole } = useUpdateMemberRole(member.id);
  const handleChangeRole = (newRole: string) => {
    alertDialog.open(`Change ${displayName}'s role?`, {
      description: `You are about to change ${displayName}'s role to ${newRole}. This may affect their permissions.`,
      action: {
        label: "Change",
        onClick: () => updateMemberRole(newRole),
      },
    });
  };

  const { mutateAsync: removeMember } = useRemoveMember(member.id);
  const handleRemoveFromOrganization = () => {
    alertDialog.open(`Remove ${displayName} from the organization?`, {
      description: `You are about to remove ${displayName} from the organization. They will lose access to this organization.`,
      action: {
        label: "Remove",
        onClick: removeMember,
      },
    });
  };

  if (userRole === "member") {
    return null;
  }

  const actions = [
    !isMemberSelf && (
      <DropdownMenuSub key="change-role">
        <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
        <DropdownMenuSubContent>
          <DropdownMenuRadioGroup value={member.role} onValueChange={handleChangeRole}>
            {["owner", "admin", "member"].map((role) => (
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

const useUpdateMemberRole = (memberId: string) =>
  useMutation({
    mutationFn: async (newRole: string) => {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole as "owner" | "admin" | "member",
      });
    },
    onSuccess: () => toast.success("Member role updated successfully"),
    onError: (error) => toast.error(error.message),
  });

const useRemoveMember = (memberId: string) =>
  useMutation({
    mutationFn: async () => {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });
    },
    onSuccess: () => toast.success("Member removed successfully"),
    onError: (error) => toast.error(error.message),
  });
