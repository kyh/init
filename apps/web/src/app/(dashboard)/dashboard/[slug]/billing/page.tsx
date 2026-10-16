import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getOrganizationBySlug } from "@/lib/auth-server";
import { Skeleton } from "@repo/ui/components/skeleton";

import { hasPermission } from "@repo/permissions";
import { PageHeader } from "@/components/header";
import { resolveOrganizationPage } from "../_components/organization-page";
import { BillingHistory, BillingPlan } from "./_components/billing-plan";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface SectionProps extends PageProps {
  section: typeof BillingPlan | typeof BillingHistory;
}

// Each section resolves the organization and the viewer's role under its own Suspense
// boundary; React's request cache runs the lookup once for both.
const BillingSection = async ({ params, section: Section }: SectionProps) => {
  const { session, slug } = await resolveOrganizationPage(params, "/billing");

  const organization = await getOrganizationBySlug(slug).catch(() => null);
  if (!organization) {
    return redirect("/dashboard");
  }

  const role = organization.members.find((member) => member.userId === session.user.id)?.role;
  const canManage = hasPermission(role, { billing: ["manage"] });

  return <Section organizationId={organization.id} slug={slug} canManage={canManage} />;
};

const Page = ({ params }: PageProps) => (
  <main className="flex flex-1 flex-col px-5">
    <PageHeader>Billing</PageHeader>
    <section className="divide-border divide-y">
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-primary text-base leading-7 font-light">Your Plan</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Manage your subscription and billing details.
          </p>
        </div>
        <div className="md:col-span-2">
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <BillingSection params={params} section={BillingPlan} />
          </Suspense>
        </div>
      </div>
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-primary text-base leading-7 font-light">Order History</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Download invoices and view your order history.
          </p>
        </div>
        <div className="space-y-3 md:col-span-2">
          <Suspense fallback={<Skeleton className="h-24 w-full" />}>
            <BillingSection params={params} section={BillingHistory} />
          </Suspense>
        </div>
      </div>
    </section>
  </main>
);

export default Page;
