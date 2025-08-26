"use client";

import type { Invitation } from "better-auth/plugins";
import { useMemo } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { Session } from "@repo/api/auth/auth";
import type { ColumnDef } from "@tanstack/react-table";
import { useOrganization } from "@/app/(dashboard)/_components/use-organization";
import { authClient } from "@/auth/auth-client";

type InvitationsTableProps = {
  user: Session["user"];
  slug: string;
};

export const InvitationsTable = ({ user, slug }: InvitationsTableProps) => {
  const queryClient = useQueryClient();
  const { data: organization, queryKey } = useOrganization(slug);

  const userId = user.id;
  const userRole =
    organization.members.find((member) => member.userId === userId)?.role ??
    "member";

  const columns = useMemo(() => {
    const columnDefs: ColumnDef<Invitation>[] = [
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
            userRole={userRole}
            onRemoveInvitation={() =>
              queryClient.invalidateQueries({ queryKey })
            }
          />
        ),
      },
    ];

    return columnDefs;
  }, [userRole, queryKey, queryClient]);

  const table = useReactTable({
    data: organization.invitations,
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
  invitation,
  userRole,
  onRemoveInvitation,
}: {
  invitation: Invitation;
  userRole: string | undefined;
  onRemoveInvitation?: () => Promise<void>;
}) => {
  const handleRemoveInvitation = () => {
    alertDialog.open(`Remove ${invitation.email}'s invite?`, {
      description: `You are about to remove ${invitation.email}'s invite. This will revoke their access to the organization.`,
      action: {
        label: "Remove",
        onClick: () => {
          return authClient.organization
            .cancelInvitation({
              invitationId: invitation.id,
              fetchOptions: {
                onSuccess: () => {
                  toast.success("Invitation cancelled successfully");
                },
                onError: ({ error }) => {
                  toast.error(error.message);
                },
              },
            })
            .then(() => onRemoveInvitation?.());
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
        <DropdownMenuItem onSelect={handleRemoveInvitation}>
          Remove Invitation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
