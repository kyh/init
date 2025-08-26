"use client";

import type { Invitation, Member, Organization } from "better-auth/plugins";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { alertDialog } from "@repo/ui/alert-dialog";
import { Badge } from "@repo/ui/badge";
import { Button } from "@repo/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/dropdown-menu";
import { AutoTable } from "@repo/ui/table";
import { toast } from "@repo/ui/toast";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { Session } from "@repo/api/auth/auth";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/auth/auth-client";

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
  const invitations =
    organization.invitations?.filter(
      (invitation) => invitation.status !== "canceled",
    ) ?? [];
  const members = organization.members ?? [];
  const userRole = members.find(
    (member: Member) => member.userId === userId,
  )?.role;

  const columns = useMemo(() => {
    return getColumns({ userRole });
  }, [userRole]);

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
  userRole: string | undefined;
};

export const getColumns = ({
  userRole,
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
      <ActionsDropdown invitation={row.original} userRole={userRole} />
    ),
  },
];

const ActionsDropdown = ({
  invitation,
  userRole,
}: {
  invitation: Invitation;
  userRole: string | undefined;
}) => {
  const router = useRouter();

  const onRemoveInvitation = () => {
    alertDialog.open(`Remove ${invitation.email}'s invite?`, {
      description: `You are about to remove ${invitation.email}'s invite. This will revoke their access to the organization.`,
      action: {
        label: "Remove",
        onClick: async () => {
          try {
            await authClient.organization.cancelInvitation({
              invitationId: invitation.id,
            });
            toast.success("Invitation cancelled successfully");
            router.refresh();
          } catch (error) {
            console.error("Failed to cancel invitation:", error);
            toast.error("Failed to cancel invitation. Please try again.");
          }
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
        <DropdownMenuItem onSelect={onRemoveInvitation}>
          Remove Invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
