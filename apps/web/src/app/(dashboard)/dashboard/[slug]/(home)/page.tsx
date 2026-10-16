import { Suspense } from "react";
import { Skeleton } from "@repo/ui/components/skeleton";

import { PageHeader } from "@/components/header";
import { HydrateClient, orpc, prefetch } from "@/orpc/server";
import { resolveOrganizationPage } from "../_components/organization-page";
import { TodoList } from "./_components/todo-list";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

const TodoListSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-9 w-full" />
    {["a", "b", "c", "d"].map((key) => (
      <Skeleton key={key} className="h-12 w-full" />
    ))}
  </div>
);

const Todos = async ({ params }: PageProps) => {
  const { slug } = await resolveOrganizationPage(params);
  prefetch(orpc.todo.list.queryOptions({ input: { slug } }));

  return (
    <HydrateClient>
      <TodoList slug={slug} />
    </HydrateClient>
  );
};

const Page = ({ params }: PageProps) => (
  <main className="flex flex-1 flex-col px-5 pb-5">
    <PageHeader>Todos</PageHeader>
    <section className="max-w-4xl space-y-8">
      <Suspense fallback={<TodoListSkeleton />}>
        <Todos params={params} />
      </Suspense>
    </section>
  </main>
);

export default Page;
