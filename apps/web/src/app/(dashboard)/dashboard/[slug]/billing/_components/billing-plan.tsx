"use client";

import { useState } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { toast } from "@repo/ui/components/sonner";
import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { formatDate } from "@/lib/format";

type BillingPlanProps = {
  organizationId: string;
  slug: string;
  canManage: boolean;
};

const useSubscriptions = (organizationId: string) =>
  useQuery({
    queryKey: ["subscriptions", organizationId],
    queryFn: async () => {
      const { data, error } = await authClient.subscription.list({
        query: { referenceId: organizationId },
      });
      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
  });

export const BillingPlan = ({ organizationId, slug, canManage }: BillingPlanProps) => {
  const { data: subscriptions, isPending } = useSubscriptions(organizationId);
  const [redirecting, setRedirecting] = useState<"upgrade" | "portal" | null>(null);

  const returnUrl = `/dashboard/${slug}/billing`;
  const subscription = subscriptions?.find(
    (sub) => sub.status === "active" || sub.status === "trialing",
  );

  // Both calls redirect the browser to Stripe on success
  const handleUpgrade = async () => {
    setRedirecting("upgrade");
    await authClient.subscription.upgrade({
      plan: "pro",
      referenceId: organizationId,
      successUrl: returnUrl,
      cancelUrl: returnUrl,
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setRedirecting(null);
        },
      },
    });
  };

  const handlePortal = async () => {
    setRedirecting("portal");
    await authClient.subscription.billingPortal({
      referenceId: organizationId,
      returnUrl,
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setRedirecting(null);
        },
      },
    });
  };

  if (isPending) {
    return <p className="text-muted-foreground text-sm">Loading subscription…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium capitalize">{subscription?.plan ?? "Free"}</span>
        {subscription && (
          <Badge className="capitalize" variant="secondary">
            {subscription.status}
          </Badge>
        )}
        {subscription?.cancelAtPeriodEnd && <Badge variant="destructive">Cancels soon</Badge>}
      </div>
      {subscription?.periodEnd && (
        <p className="text-muted-foreground text-sm">
          {subscription.cancelAtPeriodEnd ? "Access until" : "Renews"}{" "}
          {formatDate(subscription.periodEnd)}
        </p>
      )}
      {canManage ? (
        <div className="flex gap-2">
          {subscription ? (
            <Button onClick={handlePortal} loading={redirecting === "portal"}>
              Manage subscription
            </Button>
          ) : (
            <Button onClick={handleUpgrade} loading={redirecting === "upgrade"}>
              Upgrade to Pro
            </Button>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Only organization owners and admins can manage billing.
        </p>
      )}
    </div>
  );
};

export const BillingHistory = ({ organizationId, slug, canManage }: BillingPlanProps) => {
  const [redirecting, setRedirecting] = useState(false);

  const handlePortal = async () => {
    setRedirecting(true);
    await authClient.subscription.billingPortal({
      referenceId: organizationId,
      returnUrl: `/dashboard/${slug}/billing`,
      fetchOptions: {
        onError: (ctx) => {
          toast.error(ctx.error.message);
          setRedirecting(false);
        },
      },
    });
  };

  if (!canManage) {
    return null;
  }

  return (
    <div>
      <Button variant="outline" onClick={handlePortal} loading={redirecting}>
        View invoices in Stripe
      </Button>
    </div>
  );
};
