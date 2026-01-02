import { useState, useEffect, type FormEvent } from "react";
import { PencilIcon, Trash2Icon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getTrpcClient, type RouterOutputs } from "@/lib/api";
import { cn } from "@/lib/utils";

type Todo = RouterOutputs["todo"]["list"]["todos"][number];

type TodoListProps = {
  slug: string;
};

export function TodoList({ slug }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const fetchTodos = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const client = await getTrpcClient();
      const result = await client.todo.list.query({ slug });
      setTodos(result.todos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch todos");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTodos();
  }, [slug]);

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    setIsCreating(true);

    try {
      const client = await getTrpcClient();
      const result = await client.todo.create.mutate({ slug, title: trimmed });
      const newTodo = result.todo;
      if (newTodo) {
        setTodos((prev) => [newTodo, ...prev]);
      }
      setNewTitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create todo");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (todo: Todo) => {
    setUpdatingIds((prev) => new Set(prev).add(todo.id));

    try {
      const client = await getTrpcClient();
      const result = await client.todo.update.mutate({
        slug,
        id: todo.id,
        completed: !todo.completed,
      });
      const updatedTodo = result.todo;
      if (updatedTodo) {
        setTodos((prev) =>
          prev.map((t) => (t.id === todo.id ? updatedTodo : t)),
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
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
    if (!trimmed) return;

    setUpdatingIds((prev) => new Set(prev).add(editingId));

    try {
      const client = await getTrpcClient();
      const result = await client.todo.update.mutate({
        slug,
        id: editingId,
        title: trimmed,
      });
      const updatedTodo = result.todo;
      const todoId = editingId;
      if (updatedTodo) {
        setTodos((prev) =>
          prev.map((t) => (t.id === todoId ? updatedTodo : t)),
        );
      }
      cancelEditing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update todo");
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(editingId);
        return next;
      });
    }
  };

  const handleDelete = async (todo: Todo) => {
    if (!confirm(`Delete "${todo.title}"?`)) return;

    setDeletingIds((prev) => new Set(prev).add(todo.id));

    try {
      const client = await getTrpcClient();
      await client.todo.delete.mutate({ slug, id: todo.id });
      setTodos((prev) => prev.filter((t) => t.id !== todo.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete todo");
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(todo.id);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new todo..."
          disabled={isCreating}
          className="flex-1"
        />
        <Button type="submit" size="sm" loading={isCreating}>
          Add
        </Button>
      </form>

      {todos.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-4">
          No todos yet. Add your first one above.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {todos.map((todo) => {
            const isEditing = editingId === todo.id;
            const isUpdating = updatingIds.has(todo.id);
            const isDeleting = deletingIds.has(todo.id);

            return (
              <li
                key={todo.id}
                className="flex items-start gap-2 rounded-md border p-2"
              >
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() => handleToggle(todo)}
                  disabled={isUpdating || isDeleting}
                  className="mt-0.5"
                />

                {isEditing ? (
                  <div className="flex flex-1 flex-col gap-2">
                    <Input
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      disabled={isUpdating}
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={handleSaveEdit}
                        loading={isUpdating}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <span
                        className={cn(
                          "text-sm break-words",
                          todo.completed && "line-through text-muted-foreground",
                        )}
                      >
                        {todo.title}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditing(todo)}
                        disabled={isUpdating || isDeleting}
                        className="h-7 w-7"
                      >
                        <PencilIcon className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDelete(todo)}
                        loading={isDeleting}
                        className="h-7 w-7"
                      >
                        <Trash2Icon className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
