import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";

import { PageHeader } from "@/components/header";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { TodoList } from "./_components/todo-list";

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
    return redirect(`/auth/login?nextPath=/dashboard/${slug}/todos`);
  }

  prefetch(trpc.todo.list.queryOptions({ slug }));

  return (
    <HydrateClient>
      <main className="flex flex-1 flex-col px-5 pb-5">
        <PageHeader>Todos</PageHeader>
        <section className="max-w-4xl space-y-8">
          <TodoList slug={slug} />
        </section>
      </main>
    </HydrateClient>
  );
};

export default Page;
