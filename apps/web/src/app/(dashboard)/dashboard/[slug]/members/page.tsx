import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";

import { PageHeader } from "@/components/header";
import { HydrateClient, orpc, prefetch } from "@/orpc/server";
import { resolveOrganizationPage } from "../_components/organization-page";
import { InvitationsTable } from "./_components/invitations-table";
import { InviteMembersDialog } from "./_components/invite-members-form";
import { MembersTable } from "./_components/members-table";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const SKELETON_ROW_KEYS = ["a", "b", "c", "d", "e"];

const RowsSkeleton = ({ rows, withAvatar }: { rows: number; withAvatar?: boolean }) => (
  <div className="rounded-md border">
    {SKELETON_ROW_KEYS.slice(0, rows).map((key) => (
      <div key={key} className="flex items-center gap-4 border-b p-4 last:border-b-0">
        {withAvatar ? <Skeleton className="size-9 rounded-full" /> : null}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-5 w-16" />
      </div>
    ))}
  </div>
);

const InvitationsSkeleton = () => (
  <>
    <div className="flex justify-end">
      <Skeleton className="h-8 w-24" />
    </div>
    <RowsSkeleton rows={2} />
  </>
);

// Both sections read the slug and the organization query under their own Suspense boundary.
const Members = async ({ params }: PageProps) => {
  const { slug } = await resolveOrganizationPage(params, "/members");
  prefetch(orpc.organization.get.queryOptions({ input: { slug } }));

  return (
    <HydrateClient>
      <MembersTable slug={slug} />
    </HydrateClient>
  );
};

const Invitations = async ({ params }: PageProps) => {
  const { slug } = await resolveOrganizationPage(params, "/members");
  prefetch(orpc.organization.get.queryOptions({ input: { slug } }));

  return (
    <HydrateClient>
      <div className="flex justify-end">
        <InviteMembersDialog slug={slug} />
      </div>
      <InvitationsTable slug={slug} />
    </HydrateClient>
  );
};

const Page = ({ params }: PageProps) => (
  <main className="flex flex-1 flex-col px-5">
    <PageHeader>Organization Members</PageHeader>
    <section className="divide-border divide-y">
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-primary text-base leading-7 font-light">Members</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Manage the members of your organization.
          </p>
        </div>
        <div className="md:col-span-2">
          <Suspense fallback={<RowsSkeleton rows={3} withAvatar />}>
            <Members params={params} />
          </Suspense>
        </div>
      </div>
      <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
        <div>
          <h2 className="text-primary text-base leading-7 font-light">Pending Invites</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Manage the pending invitations to your organization.
          </p>
        </div>
        <div className="space-y-3 md:col-span-2">
          <Suspense fallback={<InvitationsSkeleton />}>
            <Invitations params={params} />
          </Suspense>
        </div>
      </div>
    </section>
  </main>
);

export default Page;
