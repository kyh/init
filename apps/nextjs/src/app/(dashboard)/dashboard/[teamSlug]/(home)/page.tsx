import { PageHeader } from "@/components/header";
import { HydrateClient } from "@/trpc/server";

type PageProps = {
  params: Promise<{
    teamSlug: string;
  }>;
};

const Page = async (props: PageProps) => {
  const params = await props.params;
  const teamSlug = params.teamSlug;

  return (
    <HydrateClient>
      <main className="flex flex-1 flex-col px-5">
        <PageHeader>Welcome back</PageHeader>
        <section>{teamSlug}</section>
      </main>
    </HydrateClient>
  );
};

export default Page;
