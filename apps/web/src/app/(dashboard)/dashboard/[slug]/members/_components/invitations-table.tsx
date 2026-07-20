"use client";

import { useMemo } from "react";
import { alertDialog } from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { AutoTable } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";

import type { RouterOutputs } from "@repo/api";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { useTRPC } from "@/trpc/react";
import { hasPermission } from "@/app/(dashboard)/dashboard/[slug]/_components/role";
import { TableRowActions } from "@/app/(dashboard)/dashboard/[slug]/_components/table-row-actions";
import { useOrganization } from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

type Invitation = RouterOutputs["organization"]["get"]["invitations"][number];

type InvitationsTableProps = {
  slug: string;
};

export const InvitationsTable = ({ slug }: InvitationsTableProps) => {
  const { data: organizationData } = useOrganization(slug);
  const canManageInvitations = hasPermission(organizationData.currentUserMember.role, {
    invitation: ["cancel"],
  });

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
        cell: ({ row }) => formatDate(row.original.expiresAt),
      },
      {
        header: "",
        id: "actions",
        cell: ({ row }) => (
          <ActionsDropdown
            slug={slug}
            invitation={row.original}
            canManageInvitations={canManageInvitations}
          />
        ),
      },
    ];

    return columnDefs;
  }, [slug, canManageInvitations]);

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
  slug,
  invitation,
  canManageInvitations,
}: {
  slug: string;
  invitation: Invitation;
  canManageInvitations: boolean;
}) => {
  const { mutateAsync: cancelInvitation } = useCancelInvitation(slug, invitation.id);

  const handleRemoveInvitation = () => {
    alertDialog.open(`Remove ${invitation.email}'s invite?`, {
      description: `You are about to remove ${invitation.email}'s invite. This will revoke their access to the organization.`,
      action: {
        label: "Remove",
        onClick: cancelInvitation,
      },
    });
  };

  if (!canManageInvitations) {
    return null;
  }

  return (
    <TableRowActions>
      <DropdownMenuItem onSelect={handleRemoveInvitation}>Remove Invitation</DropdownMenuItem>
    </TableRowActions>
  );
};

const useCancelInvitation = (slug: string, invitationId: string) => {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return useMutation({
    mutationFn: async () => {
      await authClient.organization.cancelInvitation({
        invitationId,
      });
    },
    onSuccess: () => {
      toast.success("Invitation cancelled successfully");
      return queryClient.invalidateQueries(trpc.organization.get.queryFilter({ slug }));
    },
    onError: (error) => toast.error(error.message),
  });
};
