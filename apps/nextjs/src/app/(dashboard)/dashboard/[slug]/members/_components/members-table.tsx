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
import { useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { MemberWithUser } from "@/app/(dashboard)/_components/use-organization";
import type { Session } from "@repo/api/auth/auth";
import type { ColumnDef } from "@tanstack/react-table";
import { useOrganization } from "@/app/(dashboard)/_components/use-organization";
import { authClient } from "@/auth/auth-client";

type MembersTableProps = {
  slug: string;
  user: Session["user"];
};

export const MembersTable = ({ user, slug }: MembersTableProps) => {
  const queryClient = useQueryClient();
  const { data: organization, queryKey } = useOrganization(slug);
  const userId = user.id;
  const userRole = organization.members.find(
    (member) => member.userId === userId,
  )?.role;

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
        cell: ({ row }) =>
          new Date(row.original.createdAt).toLocaleDateString(),
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionsDropdown
            member={row.original}
            userId={userId}
            userRole={userRole}
            onRemoveMember={() => queryClient.invalidateQueries({ queryKey })}
            onUpdateMemberRole={() =>
              queryClient.invalidateQueries({ queryKey })
            }
          />
        ),
      },
    ];

    return columnDefs;
  }, [userId, userRole, queryClient, queryKey]);

  const table = useReactTable({
    data: organization.members,
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
  onRemoveMember,
  onUpdateMemberRole,
}: {
  member: MemberWithUser;
  userId: string;
  userRole: string | undefined;
  onRemoveMember?: (memberId: string) => Promise<void>;
  onUpdateMemberRole?: (memberId: string, role: string) => Promise<void>;
}) => {
  const isMemberSelf = member.userId === userId;
  const isMemberOwner = member.role === "owner";
  const displayName = getDisplayName(member);

  const handleChangeRole = (newRole: string) => {
    alertDialog.open(`Change ${displayName}'s role?`, {
      description: `You are about to change ${displayName}'s role to ${newRole}. This may affect their permissions.`,
      action: {
        label: "Change",
        onClick: () => {
          return authClient.organization
            .updateMemberRole({
              memberId: member.id,
              role: newRole as "owner" | "admin" | "member",
              fetchOptions: {
                onSuccess: () => {
                  toast.success("Member role updated successfully");
                },
                onError: ({ error }) => {
                  toast.error(error.message);
                },
              },
            })
            .then(() => onUpdateMemberRole?.(member.id, newRole));
        },
      },
    });
  };

  const handleRemoveFromOrganization = () => {
    alertDialog.open(`Remove ${displayName} from the organization?`, {
      description: `You are about to remove ${displayName} from the organization. They will lose access to this organization.`,
      action: {
        label: "Remove",
        onClick: () => {
          return authClient.organization
            .removeMember({
              memberIdOrEmail: member.id,
              fetchOptions: {
                onSuccess: () => {
                  toast.success("Member removed successfully");
                },
                onError: ({ error }) => {
                  toast.error(error.message);
                },
              },
            })
            .then(() => onRemoveMember?.(member.id));
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
            onValueChange={handleChangeRole}
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
      <DropdownMenuItem
        key="remove-member"
        onSelect={handleRemoveFromOrganization}
      >
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
