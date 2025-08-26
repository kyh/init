"use client";

import type { Invitation, Member, Organization } from "better-auth/plugins";
import { useMemo } from "react";
import { alertDialog } from "@repo/ui/alert-dialog";
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

type InvitationsTableProps = {
  user: Session["user"];
  organization: Organization & {
    members?: Member[];
    invitations?: Invitation[];
  };
};

export const InvitationsTable = ({
  user,
  organization,
}: InvitationsTableProps) => {
  const userId = user.id;
  const invitations = organization.invitations ?? [];
  const members = organization.members ?? [];
  const userRole = members.find(
    (member: Member) => member.userId === userId,
  )?.role;

  const columns = useMemo(() => {
    return getColumns({ userId, userRole, organizationId: organization.id });
  }, [userId, userRole, organization]);

  const table = useReactTable({
    data: invitations,
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
}: getColumnsParams): ColumnDef<Invitation>[] => [
  {
    header: "Email",
    cell: ({ row }) => row.original.email,
  },
  {
    header: "Role",
    cell: ({ row }) => (
      <Badge className="capitalize">{row.original.role || "member"}</Badge>
    ),
  },
  {
    header: "Expires at",
    cell: ({ row }) => {
      return new Date(row.original.expiresAt).toLocaleDateString();
    },
  },
  {
    header: "",
    id: "actions",
    cell: ({ row }) => (
      <ActionsDropdown
        invitation={row.original}
        userId={userId}
        userRole={userRole}
        organizationId={organizationId}
      />
    ),
  },
];

const ActionsDropdown = ({
  invitation,
  userId,
  userRole,
  organizationId,
}: {
  invitation: Invitation;
  userId: string;
  userRole: string | undefined;
  organizationId: string;
}) => {
  const onChangeRole = (newRole: string) => {
    alertDialog.open(`Change ${invitation.email}'s role?`, {
      description: `You are about to change ${invitation.email}'s role to ${newRole}. This may affect their permissions.`,
      action: {
        label: "Change",
        onClick: () => {
          // TODO: Implement role change using better-auth API
          console.log("Change invitation role to:", newRole);
        },
      },
    });
  };

  const onRemoveInvitation = () => {
    alertDialog.open(`Remove ${invitation.email}'s invite?`, {
      description: `You are about to remove ${invitation.email}'s invite. This will revoke their access to the organization.`,
      action: {
        label: "Remove",
        onClick: () => {
          // TODO: Implement invitation removal using better-auth API
          console.log("Remove invitation:", invitation.id);
        },
      },
    });
  };

  // Members have no permissions to do any actions
  if (userRole === "member") {
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>Change Role</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={invitation.role || "member"}
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
        <DropdownMenuItem onSelect={onRemoveInvitation}>
          Remove Invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
