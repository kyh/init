import { redirect } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getOrganizationBySlug, getSession } from "@/lib/auth-server";

import { roleSchema } from "@/app/(dashboard)/dashboard/[slug]/_components/role";
import { PageHeader } from "@/components/header";
import { BillingHistory, BillingPlan } from "./_components/billing-plan";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const Page = async (props: PageProps) => {
  const params = await props.params;
  const slug = params.slug;

  const session = await getSession();
  if (!session) {
    return redirect(`/auth/login?nextPath=/dashboard/${slug}/billing`);
  }

  const organization = await getOrganizationBySlug(slug).catch(() => null);
  if (!organization) {
    return redirect("/dashboard");
  }

  const role = organization.members.find((member) => member.userId === session.user.id)?.role;
  const parsedRole = roleSchema.safeParse(role);
  const canManage =
    parsedRole.success &&
    authClient.organization.checkRolePermission({
      role: parsedRole.data,
      permissions: { billing: ["manage"] },
    });

  return (
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
            <BillingPlan organizationId={organization.id} slug={slug} canManage={canManage} />
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
            <BillingHistory organizationId={organization.id} slug={slug} canManage={canManage} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
