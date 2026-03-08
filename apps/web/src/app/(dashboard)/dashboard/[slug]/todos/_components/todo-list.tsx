"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { alertDialog } from "@repo/ui/alert-dialog";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";

import type { RouterInputs, RouterOutputs } from "@repo/api";
import { useTRPC, useTRPCClient } from "@/trpc/react";

type TodoListProps = {
  slug: string;
};

type Todo = RouterOutputs["todo"]["list"]["todos"][number];
type CreateTodoInput = RouterInputs["todo"]["create"];
type UpdateTodoInput = RouterInputs["todo"]["update"];
type DeleteTodoInput = RouterInputs["todo"]["delete"];

export const TodoList = ({ slug }: TodoListProps) => {
  const trpc = useTRPC();
  const trpcClient = useTRPCClient();
  const { data } = useSuspenseQuery(trpc.todo.list.queryOptions({ slug }));
  const todos = data.todos;

  const createTodo = useMutation({
    mutationFn: (input: CreateTodoInput) => trpcClient.todo.create.mutate(input),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateTodo = useMutation({
    mutationFn: (input: UpdateTodoInput) => trpcClient.todo.update.mutate(input),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteTodo = useMutation({
    mutationFn: (input: DeleteTodoInput) => trpcClient.todo.delete.mutate(input),
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState("");

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("Please enter a title before adding a todo.");
      return;
    }

    try {
      await createTodo.mutateAsync({ slug, title: trimmed });
      toast.success("Todo created");
      setNewTitle("");
    } catch {
      // Error handled in onError
    }
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    const trimmed = editingTitle.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }

    try {
      await updateTodo.mutateAsync({ slug, id: editingId, title: trimmed });
      toast.success("Todo updated");
      cancelEditing();
    } catch {
      // Error handled in onError
    }
  };

  const handleToggle = async (todo: Todo) => {
    try {
      await updateTodo.mutateAsync({
        slug,
        id: todo.id,
        completed: !todo.completed,
      });
    } catch {
      // Error handled in onError
    }
  };

  const handleDelete = (todo: Todo) => {
    alertDialog.open(`Delete "${todo.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          try {
            await deleteTodo.mutateAsync({ slug, id: todo.id });
            toast.success("Todo deleted");
          } catch {
            // Error handled in onError
          }
        },
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newTitle}
          onChange={(event) => setNewTitle(event.target.value)}
          placeholder="Add a new todo"
          aria-label="Todo title"
          disabled={createTodo.isPending}
        />
        <Button type="submit" loading={createTodo.isPending} className="sm:w-auto">
          Add
        </Button>
      </form>
      {todos.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You haven't created any todos yet. Add your first one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            const isDeleting = deleteTodo.isPending && deleteTodo.variables.id === todo.id;

            return (
              <li key={todo.id} className="border-border bg-background rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={() => handleToggle(todo)}
                      aria-label={
                        todo.completed ? "Mark todo as incomplete" : "Mark todo as complete"
                      }
                      disabled={updateTodo.isPending}
                    />
                    {isEditing ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={editingTitle}
                          onChange={(event) => setEditingTitle(event.target.value)}
                          aria-label="Edit todo title"
                          disabled={updateTodo.isPending}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleSaveEdit}
                            loading={updateTodo.isPending}
                          >
                            Save
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelEditing}
                            disabled={updateTodo.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span
                          className={cn(
                            "text-base font-medium",
                            todo.completed && "text-muted-foreground line-through",
                          )}
                        >
                          {todo.title}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {todo.completed ? "Completed" : "Pending"}
                        </span>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(todo)}
                        disabled={updateTodo.isPending || createTodo.isPending}
                        aria-label={`Edit ${todo.title}`}
                      >
                        <PencilIcon className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(todo)}
                        loading={isDeleting}
                        aria-label={`Delete ${todo.title}`}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
