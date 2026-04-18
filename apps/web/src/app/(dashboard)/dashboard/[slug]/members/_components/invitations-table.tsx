"use client";

import { useMemo } from "react";
import { alertDialog } from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { AutoTable } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontalIcon } from "lucide-react";

import type { RouterOutputs } from "@repo/api";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/trpc/react";

type Invitation = RouterOutputs["organization"]["get"]["invitations"][number];

type InvitationsTableProps = {
  slug: string;
};

export const InvitationsTable = ({ slug }: InvitationsTableProps) => {
  const trpc = useTRPC();
  const { data: organizationData } = useSuspenseQuery(
    trpc.organization.get.queryOptions({
      slug,
    }),
  );
  const userRole = organizationData.currentUserMember.role;

  const columns = useMemo(() => {
    const columnDefs: ColumnDef<Invitation>[] = [
      {
        header: "Email",
        cell: ({ row }) => row.original.email,
      },
      {
        header: "Role",
        cell: ({ row }) => <Badge className="capitalize">{row.original.role ?? "member"}</Badge>,
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
        cell: ({ row }) => <ActionsDropdown invitation={row.original} userRole={userRole} />,
      },
    ];

    return columnDefs;
  }, [userRole]);

  const table = useReactTable({
    data: organizationData.invitations,
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
}: {
  invitation: Invitation;
  userRole: string | undefined;
}) => {
  const { mutateAsync: cancelInvitation } = useCancelInvitation(invitation.id);

  const handleRemoveInvitation = () => {
    alertDialog.open(`Remove ${invitation.email}'s invite?`, {
      description: `You are about to remove ${invitation.email}'s invite. This will revoke their access to the organization.`,
      action: {
        label: "Remove",
        onClick: cancelInvitation,
      },
    });
  };

  // Members have no permissions to do any actions
  if (userRole === "member") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button aria-label="Open menu" variant="ghost" size="icon" />}>
        <MoreHorizontalIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onSelect={handleRemoveInvitation}>Remove Invitation</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const useCancelInvitation = (invitationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.organization.cancelInvitation({
        invitationId,
      });
    },
    onSuccess: async () => {
      toast.success("Invitation cancelled successfully");
      await queryClient.invalidateQueries();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
