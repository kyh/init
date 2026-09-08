"use client";

import { useMemo } from "react";
import { alertDialog } from "@repo/ui/components/alert-dialog";
import { Badge } from "@repo/ui/components/badge";
import { DropdownMenuItem } from "@repo/ui/components/dropdown-menu";
import { AutoTable, autoTableFeatures } from "@repo/ui/components/table";
import { toast } from "@repo/ui/components/sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTable } from "@tanstack/react-table";

import type { RouterOutputs } from "@repo/api";
import type { AutoTableFeatures } from "@repo/ui/components/table";
import type { ColumnDef } from "@tanstack/react-table";
import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";
import { hasPermission } from "@repo/api/auth/permissions";
import { TableRowActions } from "@/app/(dashboard)/dashboard/[slug]/_components/table-row-actions";
import {
  invalidateOrganization,
  useOrganization,
} from "@/app/(dashboard)/dashboard/[slug]/_components/use-organization";

type Invitation = RouterOutputs["organization"]["get"]["invitations"][number];

const useCancelInvitation = (slug: string, invitationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      authClient.organization.cancelInvitation({
        fetchOptions: { throw: true },
        invitationId,
      }),
    onError: (error) => toast.error(error.message),
    onSuccess: () => {
      toast.success("Invitation cancelled successfully");
      return invalidateOrganization(queryClient, slug);
    },
  });
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
      action: {
        label: "Remove",
        onClick: async () => {
          await cancelInvitation();
        },
      },
      description: `You are about to remove ${invitation.email}'s invite. This will revoke their access to the organization.`,
    });
  };

  if (!canManageInvitations) {
    return null;
  }

  return (
    <TableRowActions>
      <DropdownMenuItem onClick={handleRemoveInvitation}>Remove Invitation</DropdownMenuItem>
    </TableRowActions>
  );
};

const createColumns = (
  slug: string,
  canManageInvitations: boolean,
): ColumnDef<AutoTableFeatures, Invitation>[] => [
  {
    cell: ({ row }) => row.original.email,
    header: "Email",
  },
  {
    cell: ({ row }) => <Badge className="capitalize">{row.original.role ?? "member"}</Badge>,
    header: "Role",
  },
  {
    cell: ({ row }) => formatDate(row.original.expiresAt),
    header: "Expires at",
  },
  {
    cell: ({ row }) => (
      <ActionsDropdown
        slug={slug}
        invitation={row.original}
        canManageInvitations={canManageInvitations}
      />
    ),
    header: "",
    id: "actions",
  },
];

interface InvitationsTableProps {
  slug: string;
}

export const InvitationsTable = ({ slug }: InvitationsTableProps) => {
  const { data: organizationData } = useOrganization(slug);
  const canManageInvitations = hasPermission(organizationData.currentUserMember.role, {
    invitation: ["cancel"],
  });

  const columns = useMemo(
    () => createColumns(slug, canManageInvitations),
    [slug, canManageInvitations],
  );

  const table = useTable({
    columns,
    data: organizationData.invitations,
    features: autoTableFeatures,
  });

  return (
    <div className="rounded-md border">
      <AutoTable table={table} />
    </div>
  );
};
