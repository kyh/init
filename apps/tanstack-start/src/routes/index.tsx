import { Suspense } from "react";
import { createTodoInput } from "@repo/api/todo/todo-schema";
import { Button } from "@repo/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/field";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import type { RouterOutputs } from "@repo/api";
import { AuthShowcase } from "@/component/auth-showcase";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="container h-screen py-16">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
          Create <span className="text-primary">T3</span> Turbo
        </h1>
        <AuthShowcase />

        <CreateTodoForm />
        <div className="w-full max-w-2xl overflow-y-scroll">
          <Suspense
            fallback={
              <div className="flex w-full flex-col gap-4">
                <TodoCardSkeleton />
                <TodoCardSkeleton />
                <TodoCardSkeleton />
              </div>
            }
          >
            <TodoList />
          </Suspense>
        </div>
      </div>
    </main>
  );
}

function CreateTodoForm() {
  const trpc = useTRPC();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  const queryClient = useQueryClient();
  const createTodo = useMutation(
    trpc.todo.create.mutationOptions({
      onSuccess: async () => {
        form.reset();
        await queryClient.invalidateQueries(trpc.todo.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to create a todo"
            : "Failed to create todo",
        );
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      title: "",
    },
    validators: {
      onSubmit: createTodoInput,
    },
    onSubmit: (data) => {
      if (!activeOrganization?.slug) {
        toast.error("Please select an organization");
        return;
      }
      createTodo.mutate({
        slug: activeOrganization.slug,
        title: data.value.title,
      });
    },
  });

  if (!activeOrganization) {
    return (
      <div className="w-full max-w-2xl text-center">
        <p className="text-muted-foreground">
          Please sign in and ensure you have an organization to create todos.
        </p>
      </div>
    );
  }

  return (
    <form
      className="w-full max-w-2xl"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.Field
          name="title"
          children={(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldContent>
                  <FieldLabel htmlFor={field.name}>Todo Title</FieldLabel>
                </FieldContent>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="Enter todo title"
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <Button type="submit">Create Todo</Button>
    </form>
  );
}

function TodoList() {
  const trpc = useTRPC();
  const { data: activeOrganization } = authClient.useActiveOrganization();

  if (!activeOrganization?.slug) {
    return (
      <div className="w-full max-w-2xl text-center">
        <p className="text-muted-foreground">
          Please sign in and ensure you have an organization to view todos.
        </p>
      </div>
    );
  }

  const { data } = useSuspenseQuery(
    trpc.todo.list.queryOptions({ slug: activeOrganization.slug }),
  );
  const todos = data.todos;

  if (todos.length === 0) {
    return (
      <div className="relative flex w-full flex-col gap-4">
        <TodoCardSkeleton pulse={false} />
        <TodoCardSkeleton pulse={false} />
        <TodoCardSkeleton pulse={false} />

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/10">
          <p className="text-2xl font-bold text-white">No todos yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {todos.map((todo) => {
        return (
          <TodoCard key={todo.id} todo={todo} slug={activeOrganization.slug} />
        );
      })}
    </div>
  );
}

function TodoCard(props: {
  todo: RouterOutputs["todo"]["list"]["todos"][number];
  slug: string;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const deleteTodo = useMutation(
    trpc.todo.delete.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.todo.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to delete a todo"
            : "Failed to delete todo",
        );
      },
    }),
  );

  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2 className="text-primary text-2xl font-bold">{props.todo.title}</h2>
        {props.todo.completed && (
          <p className="text-muted-foreground mt-2 text-sm">Completed</p>
        )}
      </div>
      <div>
        <Button
          variant="ghost"
          className="text-primary cursor-pointer text-sm font-bold uppercase hover:bg-transparent hover:text-white"
          onClick={() =>
            deleteTodo.mutate({ slug: props.slug, id: props.todo.id })
          }
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

function TodoCardSkeleton(props: { pulse?: boolean }) {
  const { pulse = true } = props;
  return (
    <div className="bg-muted flex flex-row rounded-lg p-4">
      <div className="grow">
        <h2
          className={cn(
            "bg-primary w-1/4 rounded-sm text-2xl font-bold",
            pulse && "animate-pulse",
          )}
        >
          &nbsp;
        </h2>
      </div>
    </div>
  );
}
