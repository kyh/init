import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@repo/api/auth/auth";
import { Skeleton } from "@repo/ui/components/skeleton";

import { PageHeader } from "@/components/header";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { TodoList } from "./_components/todo-list";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

const TodoListSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-9 w-full" />
    {["a", "b", "c", "d"].map((key) => (
      <Skeleton key={key} className="h-12 w-full" />
    ))}
  </div>
);

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
          <Suspense fallback={<TodoListSkeleton />}>
            <TodoList slug={slug} />
          </Suspense>
        </section>
      </main>
    </HydrateClient>
  );
};

export default Page;
