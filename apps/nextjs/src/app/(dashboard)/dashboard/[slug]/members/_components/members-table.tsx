"use client";

import type { Invitation, Member, Organization } from "better-auth/plugins";
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
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { Session } from "@repo/api/auth/auth";
import type { ColumnDef } from "@tanstack/react-table";

type MembersTableProps = {
  user: Session["user"];
  organization: Organization & {
    members?: Member[];
    invitations?: Invitation[];
  };
};

export const MembersTable = ({ user, organization }: MembersTableProps) => {
  const userId = user.id;
  const members = organization.members ?? [];
  const userRole = members.find(
    (member: Member) => member.userId === userId,
  )?.role;

  const columns = useMemo(() => {
    return getColumns({ userId, userRole, organizationId: organization.id });
  }, [userId, userRole, organization]);

  const table = useReactTable({
    data: members,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border">
      <AutoTable table={table} />
    </div>
  );
};

type getColumnsParams = {
  userId: string;
  userRole: string | undefined;
  organizationId: string;
};

export const getColumns = ({
  userId,
  userRole,
  organizationId,
}: getColumnsParams): ColumnDef<Member>[] => [
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
      // TODO: Get user email from user data when available
      return "-";
    },
  },
  {
    header: "Role",
    cell: ({ row }) => (
      <Badge className="capitalize">{row.original.role}</Badge>
    ),
  },
  {
    header: "Joined at",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    header: "",
    id: "actions",
    cell: ({ row }) => (
      <ActionsDropdown
        member={row.original}
        userId={userId}
        userRole={userRole}
        organizationId={organizationId}
      />
    ),
  },
];

const ActionsDropdown = ({
  member,
  userId,
  userRole,
  organizationId,
}: {
  member: Member;
  userId: string;
  userRole: string | undefined;
  organizationId: string;
}) => {
  const isSelfOwner = userRole === "owner";
  const isMemberSelf = member.userId === userId;
  const isMemberOwner = member.role === "owner";

  const onChangeRole = (newRole: string) => {
    const displayName = getDisplayName(member);
    alertDialog.open(`Change ${displayName}'s role?`, {
      description: `You are about to change ${displayName}'s role to ${newRole}. This may affect their permissions.`,
      action: {
        label: "Change",
        onClick: () => {
          // TODO: Implement role change using better-auth API
          console.log("Change role to:", newRole);
        },
      },
    });
  };

  const onTransferOwnership = () => {
    const displayName = getDisplayName(member);
    alertDialog.open(`Transfer ownership to ${displayName}?`, {
      description: `You are about to transfer ownership to ${displayName}. You will lose your ownership permissions.`,
      action: {
        label: "Transfer",
        onClick: () => {
          // TODO: Implement ownership transfer using better-auth API
          console.log("Transfer ownership to:", member.userId);
        },
      },
    });
  };

  const onRemoveFromTeam = () => {
    const displayName = getDisplayName(member);
    alertDialog.open(`Remove ${displayName} from the team?`, {
      description: `You are about to remove ${displayName} from the team. They will lose access to this workspace.`,
      action: {
        label: "Remove",
        onClick: () => {
          // TODO: Implement member removal using better-auth API
          console.log("Remove member:", member.userId);
        },
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
          <DropdownMenuRadioGroup
            value={member.role}
            onValueChange={onChangeRole}
          >
            {["owner", "admin", "member"].map((role) => (
              <DropdownMenuRadioItem
                key={role}
                value={role}
                className="capitalize"
              >
                {role}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    ),
    isSelfOwner &&
      !isMemberOwner && ( // Only owners can transfer ownership
        <DropdownMenuItem
          key="transfer-ownership"
          onSelect={onTransferOwnership}
        >
          Transfer Ownership
        </DropdownMenuItem>
      ),
    !isMemberOwner && ( // Cannot remove owner
      <DropdownMenuItem key="remove-member" onSelect={onRemoveFromTeam}>
        Remove from Team
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
      <DropdownMenuContent>
        {actions.map((action) => action)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getDisplayName = (member: Member) => {
  // TODO: Get user name from user data when available
  return member.userId;
};
