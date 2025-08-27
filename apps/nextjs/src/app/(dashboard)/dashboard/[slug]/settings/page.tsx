import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

import { PageHeader } from "@/components/header";
import { DeleteOrganizationForm } from "./_components/delete-organization-form";
import { UpdateOrganizationForm } from "./_components/update-organization-form";

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
    return redirect(`/auth/login?nextPath=/dashboard/${slug}/settings`);
  }

  return (
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
            <UpdateOrganizationForm slug={slug} />
          </div>
        </div>
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
          <div>
            <h2 className="text-primary text-base leading-7 font-light">
              Danger Zone
            </h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              This section contains actions that are irreversible
            </p>
          </div>
          <div className="md:col-span-2">
            <DeleteOrganizationForm slug={slug} />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
