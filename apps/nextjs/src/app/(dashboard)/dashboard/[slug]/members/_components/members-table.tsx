"use client";

import type { User } from "better-auth";
import type { Invitation, Member, Organization } from "better-auth/plugins";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { Session } from "@repo/api/auth/auth";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/auth/auth-client";

type MemberWithUser = Member & { user: User };

type MembersTableProps = {
  user: Session["user"];
  organization: Organization & {
    members?: MemberWithUser[];
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
    return getColumns({ userId, userRole });
  }, [userId, userRole]);

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
};

export const getColumns = ({
  userId,
  userRole,
}: getColumnsParams): ColumnDef<MemberWithUser>[] => [
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
      return member.user.email;
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
      />
    ),
  },
];

const ActionsDropdown = ({
  member,
  userId,
  userRole,
}: {
  member: MemberWithUser;
  userId: string;
  userRole: string | undefined;
}) => {
  const router = useRouter();
  const isMemberSelf = member.userId === userId;
  const isMemberOwner = member.role === "owner";
  const displayName = getDisplayName(member);

  const onChangeRole = (newRole: string) => {
    alertDialog.open(`Change ${displayName}'s role?`, {
      description: `You are about to change ${displayName}'s role to ${newRole}. This may affect their permissions.`,
      action: {
        label: "Change",
        onClick: async () => {
          try {
            await authClient.organization.updateMemberRole({
              memberId: member.id,
              role: newRole as "owner" | "admin" | "member",
            });
            toast.success("Member role updated successfully");
            router.refresh();
          } catch (error) {
            console.error("Failed to update member role:", error);
            toast.error("Failed to update member role. Please try again.");
          }
        },
      },
    });
  };

  const onRemoveFromOrganization = () => {
    alertDialog.open(`Remove ${displayName} from the organization?`, {
      description: `You are about to remove ${displayName} from the organization. They will lose access to this organization.`,
      action: {
        label: "Remove",
        onClick: async () => {
          try {
            await authClient.organization.removeMember({
              memberIdOrEmail: member.id,
            });
            toast.success("Member removed successfully");
            router.refresh();
          } catch (error) {
            console.error("Failed to remove member:", error);
            toast.error("Failed to remove member. Please try again.");
          }
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
    !isMemberOwner && ( // Cannot remove owner
      <DropdownMenuItem key="remove-member" onSelect={onRemoveFromOrganization}>
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
      <DropdownMenuContent>
        {actions.map((action) => action)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const getDisplayName = (member: MemberWithUser) => {
  return member.user.name;
};
