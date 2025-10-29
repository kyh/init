import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

import { PageHeader } from "@/components/header";
import { AIChatForm } from "./_components/ai-chat-form";

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
    return redirect(`/auth/login?nextPath=/dashboard/${slug}`);
  }

  return (
    <main className="flex h-dvh flex-1 flex-col px-5 pb-5">
      <PageHeader>Welcome back</PageHeader>
      <AIChatForm slug={slug} />
    </main>
  );
};

export default Page;
