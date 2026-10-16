import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";

import { PageHeader } from "@/components/header";
import { HydrateClient, orpc, prefetch } from "@/orpc/server";
import { resolveOrganizationPage } from "../_components/organization-page";
import { DeleteOrganizationForm } from "./_components/delete-organization-form";
import { UpdateOrganizationForm } from "./_components/update-organization-form";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-28" />
  </div>
);

interface SectionProps extends PageProps {
  form: React.ComponentType<{ slug: string }>;
}

// Each form reads the slug and the organization query under its own Suspense boundary.
const OrganizationForm = async ({ params, form: Form }: SectionProps) => {
  const { slug } = await resolveOrganizationPage(params, "/settings");
  prefetch(orpc.organization.get.queryOptions({ input: { slug } }));

  return (
    <HydrateClient>
      <Form slug={slug} />
    </HydrateClient>
  );
};

const Page = ({ params }: PageProps) => (
  <main className="flex flex-1 flex-col px-5">
    <PageHeader>Organization Settings</PageHeader>
    <section className="divide-border divide-y">
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-primary text-base leading-7 font-light">Organization Information</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Update your organization&apos;s information
          </p>
        </div>
        <div className="md:col-span-2">
          <Suspense fallback={<FormSkeleton />}>
            <OrganizationForm params={params} form={UpdateOrganizationForm} />
          </Suspense>
        </div>
      </div>
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-primary text-base leading-7 font-light">Danger Zone</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            This section contains actions that are irreversible
          </p>
        </div>
        <div className="md:col-span-2">
          <Suspense fallback={<Skeleton className="h-9 w-40" />}>
            <OrganizationForm params={params} form={DeleteOrganizationForm} />
          </Suspense>
        </div>
      </div>
    </section>
  </main>
);

export default Page;
