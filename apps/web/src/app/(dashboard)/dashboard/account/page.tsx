import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

import { PageHeader } from "@/components/header";
import { AppearanceForm } from "./_components/appearance-form";
import { ProfileForm } from "./_components/profile-form";

const Page = async () => {
  const session = await getSession();
  if (!session) {
    return redirect("/auth/login?nextPath=/dashboard/account");
  }

  return (
    <main className="flex flex-1 flex-col px-5">
      <PageHeader>Profile</PageHeader>
      <section className="divide-border divide-y">
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
          <div>
            <h2 className="text-primary text-base leading-7 font-light">Personal Information</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Use a permanent address where you can receive mail.
            </p>
          </div>
          <div className="md:col-span-2">
            <ProfileForm user={session.user} />
          </div>
        </div>
        <div className="grid max-w-7xl grid-cols-1 gap-x-8 gap-y-10 py-8 md:grid-cols-3">
          <div>
            <h2 className="text-primary text-base leading-7 font-light">Appearance</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Select the theme for the dashboard.
            </p>
          </div>
          <div className="md:col-span-2">
            <AppearanceForm />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;
