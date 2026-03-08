"use client";

import { useMemo } from "react";
import { alertDialog } from "@repo/ui/alert-dialog";
import { ProfileAvatar } from "@repo/ui/avatar";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { AutoTable } from "@repo/ui/table";
import { toast } from "@repo/ui/toast";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { RouterOutputs } from "@repo/api";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/react";

type MemberWithUser = RouterOutputs["organization"]["get"]["members"][number];

type MembersTableProps = {
  slug: string;
};

export const MembersTable = ({ slug }: MembersTableProps) => {
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );
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
              <ProfileAvatar
                displayName={displayName}
                avatarUrl={undefined} // TODO: Add avatar support when available
              />
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

  // Members have no permissions to do any actions
  if (userRole === "member") {
    return null;
  }

  const actions = [
    !isMemberSelf && ( // Can't change own role
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
    !isMemberOwner && ( // Cannot remove owner
      <DropdownMenuItem key="remove-member" onSelect={handleRemoveFromOrganization}>
        Remove from Organization
      </DropdownMenuItem>
    ),
  ].filter((action) => !!action);

  if (actions.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button aria-label="Open menu" variant="ghost" size="icon">
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>{actions.map((action) => action)}</DropdownMenuContent>
    </DropdownMenu>
  );
};

const getDisplayName = (member: MemberWithUser) => {
  return member.user?.name ?? member.user?.email ?? "Unknown";
};

const useUpdateMemberRole = (memberId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newRole: string) => {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole as "owner" | "admin" | "member",
      });
    },
    onSuccess: async () => {
      toast.success("Member role updated successfully");
      await queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};

const useRemoveMember = (memberId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
      });
    },
    onSuccess: async () => {
      toast.success("Member removed successfully");
      await queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
