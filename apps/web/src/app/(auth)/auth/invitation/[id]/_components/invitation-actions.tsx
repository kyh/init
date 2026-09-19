"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";

import { authClient } from "@/lib/auth-client";

interface InvitationActionsProps {
  invitationId: string;
  organizationSlug: string | null | undefined;
}

export const InvitationActions = ({ invitationId, organizationSlug }: InvitationActionsProps) => {
  const router = useRouter();
  const [pending, setPending] = useState<"accept" | "decline" | null>(null);

  const handleAccept = async () => {
    setPending("accept");
    await authClient.organization.acceptInvitation({
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setPending(null);
        },
        onSuccess: () => {
          toast.success("Invitation accepted");
          router.replace(organizationSlug ? `/dashboard/${organizationSlug}` : "/dashboard");
        },
      },
      invitationId,
    });
  };

  const handleDecline = async () => {
    setPending("decline");
    await authClient.organization.rejectInvitation({
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setPending(null);
        },
        onSuccess: () => {
          toast.success("Invitation declined");
          router.replace("/dashboard");
        },
      },
      invitationId,
    });
  };

  return (
    <div className="grid gap-2">
      <Button onClick={handleAccept} loading={pending === "accept"} disabled={pending !== null}>
        Accept invitation
      </Button>
      <Button
        variant="outline"
        onClick={handleDecline}
        loading={pending === "decline"}
        disabled={pending !== null}
      >
        Decline
      </Button>
    </div>
  );
};
