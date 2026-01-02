import type { FormEvent } from "react";
import { useState } from "react";
import { alertDialog } from "@repo/ui/alert-dialog";
import { Button } from "@repo/ui/button";
import { Checkbox } from "@repo/ui/checkbox";
import { Input } from "@repo/ui/input";
import { toast } from "@repo/ui/toast";
import { cn } from "@repo/ui/utils";
import { PencilIcon, Trash2Icon } from "lucide-react";

import { PageHeader } from "../components/page-header";
import { useTodoStore, type Todo } from "../lib/stores/todo-store";

export function TodosPage() {
  const { todos, addTodo, updateTodo, deleteTodo } = useTodoStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [editingTitle, setEditingTitle] = useState("");

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) {
      toast.error("Please enter a title before adding a todo.");
      return;
    }

    addTodo(trimmed);
    toast.success("Todo created");
    setNewTitle("");
  };

  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingTitle(todo.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = () => {
    if (!editingId) return;

    const trimmed = editingTitle.trim();
    if (!trimmed) {
      toast.error("Title is required");
      return;
    }

    updateTodo(editingId, { title: trimmed });
    toast.success("Todo updated");
    cancelEditing();
  };

  const handleToggle = (todo: Todo) => {
    updateTodo(todo.id, { completed: !todo.completed });
  };

  const handleDelete = (todo: Todo) => {
    alertDialog.open(`Delete "${todo.title}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: () => {
          deleteTodo(todo.id);
          toast.success("Todo deleted");
        },
      },
      cancel: {
        label: "Cancel",
      },
    });
  };

  return (
    <div className="flex h-full flex-col px-5">
      <PageHeader description="Manage your tasks and stay organized.">
        Todos
      </PageHeader>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="Add a new todo"
            aria-label="Todo title"
          />
          <Button type="submit" className="sm:w-auto">
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

              return (
                <li
                  key={todo.id}
                  className="border-border bg-background rounded-lg border p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => handleToggle(todo)}
                        aria-label={
                          todo.completed
                            ? "Mark todo as incomplete"
                            : "Mark todo as complete"
                        }
                      />
                      {isEditing ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                          <Input
                            value={editingTitle}
                            onChange={(event) =>
                              setEditingTitle(event.target.value)
                            }
                            aria-label="Edit todo title"
                          />
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleSaveEdit}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={cancelEditing}
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
                              todo.completed &&
                                "text-muted-foreground line-through",
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
                          aria-label={`Edit ${todo.title}`}
                        >
                          <PencilIcon className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(todo)}
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
    </div>
  );
}
