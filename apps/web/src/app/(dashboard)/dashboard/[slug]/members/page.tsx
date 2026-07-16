import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";
import { Skeleton } from "@repo/ui/components/skeleton";

import { PageHeader } from "@/components/header";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { InvitationsTable } from "./_components/invitations-table";
import { InviteMembersDialog } from "./_components/invite-members-form";
import { MembersTable } from "./_components/members-table";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

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

const Page = async (props: PageProps) => {
  const params = await props.params;
  const slug = params.slug;

  const session = await getSession();
  if (!session) {
    return redirect(`/auth/login?nextPath=/dashboard/${slug}/members`);
  }

  prefetch(trpc.organization.get.queryOptions({ slug }));

  return (
    <HydrateClient>
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
                <MembersTable slug={slug} />
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
              <div className="flex justify-end">
                <InviteMembersDialog slug={slug} />
              </div>
              <Suspense fallback={<RowsSkeleton rows={2} />}>
                <InvitationsTable slug={slug} />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </HydrateClient>
  );
};

export default Page;
