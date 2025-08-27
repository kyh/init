import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

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
              <h2 className="text-primary text-base leading-7 font-light">
                Members
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Manage the members of your organization.
              </p>
            </div>
            <div className="md:col-span-2">
              <MembersTable slug={slug} />
            </div>
          </div>
          <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
            <div>
              <h2 className="text-primary text-base leading-7 font-light">
                Pending Invites
              </h2>
              <p className="text-muted-foreground mt-1 text-sm leading-6">
                Manage the pending invitations to your organization.
              </p>
            </div>
            <div className="space-y-3 md:col-span-2">
              <div className="flex justify-end">
                <InviteMembersDialog slug={slug} />
              </div>
              <InvitationsTable slug={slug} />
            </div>
          </div>
        </section>
      </main>
    </HydrateClient>
  );
};

export default Page;
