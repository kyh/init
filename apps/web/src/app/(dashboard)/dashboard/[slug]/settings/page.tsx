import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";
import { Skeleton } from "@repo/ui/components/skeleton";

import { PageHeader } from "@/components/header";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { DeleteOrganizationForm } from "./_components/delete-organization-form";
import { UpdateOrganizationForm } from "./_components/update-organization-form";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const FormSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-4 w-24" />
    <Skeleton className="h-9 w-full" />
    <Skeleton className="h-9 w-28" />
  </div>
);

const Page = async (props: PageProps) => {
  const params = await props.params;
  const slug = params.slug;

  const session = await getSession();
  if (!session) {
    return redirect(`/auth/login?nextPath=/dashboard/${slug}/settings`);
  }

  prefetch(trpc.organization.get.queryOptions({ slug }));

  return (
    <HydrateClient>
      <main className="flex flex-1 flex-col px-5">
        <PageHeader>Organization Settings</PageHeader>
        <section className="divide-border divide-y">
          <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
            <div>
              <h2 className="text-primary text-base leading-7 font-light">
                Organization Information
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Update your organization's information
              </p>
            </div>
            <div className="md:col-span-2">
              <Suspense fallback={<FormSkeleton />}>
                <UpdateOrganizationForm slug={slug} />
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
                <DeleteOrganizationForm slug={slug} />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </HydrateClient>
  );
};

export default Page;
