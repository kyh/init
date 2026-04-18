"use client";

import { useMemo } from "react";
import { alertDialog } from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { AutoTable } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/sonner";
import { useMutation } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import type { RouterOutputs } from "@repo/api";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { TableRowActions } from "@/app/(dashboard)/dashboard/[slug]/_components/table-row-actions";
import { useOrganization } from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

type Invitation = RouterOutputs["organization"]["get"]["invitations"][number];

type InvitationsTableProps = {
  slug: string;
};

export const InvitationsTable = ({ slug }: InvitationsTableProps) => {
  const { data: organizationData } = useOrganization(slug);
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

  if (userRole === "member") {
    return null;
  }

  return (
    <TableRowActions>
      <DropdownMenuItem onSelect={handleRemoveInvitation}>Remove Invitation</DropdownMenuItem>
    </TableRowActions>
  );
};

const useCancelInvitation = (invitationId: string) =>
  useMutation({
    mutationFn: async () => {
      await authClient.organization.cancelInvitation({
        invitationId,
      });
    },
    onSuccess: () => toast.success("Invitation cancelled successfully"),
    onError: (error) => toast.error(error.message),
  });
