"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { alertDialog } from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Checkbox } from "@repo/ui/components/checkbox";
import { Input } from "@repo/ui/components/input";
import { toast } from "@repo/ui/components/sonner";
import { cn } from "@repo/ui/lib/utils";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { PencilIcon, Trash2Icon } from "lucide-react";

import type { RouterOutputs } from "@repo/api";
import { orpc } from "@/orpc/react";

type TodoListProps = {
  slug: string;
};

type Todo = RouterOutputs["todo"]["list"]["todos"][number];

const onError = (error: { message: string }) => {
  toast.error(error.message);
};

export const TodoList = ({ slug }: TodoListProps) => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(orpc.todo.list.queryOptions({ input: { slug } }));
  const todos = data.todos;

  const invalidateTodos = () =>
    queryClient.invalidateQueries({ queryKey: orpc.todo.list.key({ input: { slug } }) });

  const createTodo = useMutation(
    orpc.todo.create.mutationOptions({ onError, onSuccess: invalidateTodos }),
  );
  const updateTodo = useMutation(
    orpc.todo.update.mutationOptions({ onError, onSuccess: invalidateTodos }),
  );
  const deleteTodo = useMutation(
    orpc.todo.delete.mutationOptions({ onError, onSuccess: invalidateTodos }),
  );

  const [editing, setEditing] = useState<Pick<Todo, "id" | "title"> | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("Please enter a title before adding a todo.");
      return;
    }

    createTodo.mutate(
      { slug, title: trimmed },
      {
        onSuccess: () => {
          toast.success("Todo created");
          setNewTitle("");
        },
      },
    );
  };

  const handleSaveEdit = () => {
    if (!editing) return;

    const trimmed = editing.title.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }

    updateTodo.mutate(
      { slug, id: editing.id, title: trimmed },
      {
        onSuccess: () => {
          toast.success("Todo updated");
          setEditing(null);
        },
      },
    );
  };

  const handleDelete = (todo: Todo) => {
    alertDialog.open(`Delete "${todo.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          await deleteTodo.mutateAsync({ slug, id: todo.id });
          toast.success("Todo deleted");
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
            const isEditing = editing?.id === todo.id;
            const isDeleting = deleteTodo.isPending && deleteTodo.variables.id === todo.id;

            return (
              <li key={todo.id} className="border-border bg-background rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={todo.completed}
                      onCheckedChange={(completed) =>
                        updateTodo.mutate({ slug, id: todo.id, completed })
                      }
                      aria-label={
                        todo.completed ? "Mark todo as incomplete" : "Mark todo as complete"
                      }
                      disabled={updateTodo.isPending}
                    />
                    {isEditing ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          value={editing.title}
                          onChange={(event) =>
                            setEditing({ id: todo.id, title: event.target.value })
                          }
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
                            onClick={() => setEditing(null)}
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
                        onClick={() => setEditing({ id: todo.id, title: todo.title })}
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
