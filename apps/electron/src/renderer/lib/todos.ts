import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

const STORAGE_KEY = "init-todos";

// Storage helpers
function getTodos(): Todo[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// Query options
export const todoQueryOptions = {
  queryKey: ["todos"] as const,
  queryFn: async () => {
    // Simulate async behavior like a real API
    await new Promise((resolve) => setTimeout(resolve, 0));
    return { todos: getTodos() };
  },
};

// Hooks
export function useTodos() {
  return useSuspenseQuery(todoQueryOptions);
}

export function useCreateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (title: string) => {
      const todos = getTodos();
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      saveTodos([...todos, newTodo]);
      return newTodo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Omit<Todo, "id">>) => {
      const todos = getTodos();
      const updatedTodos = todos.map((todo) =>
        todo.id === id ? { ...todo, ...updates } : todo,
      );
      saveTodos(updatedTodos);
      return updatedTodos.find((t) => t.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const todos = getTodos();
      saveTodos(todos.filter((todo) => todo.id !== id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useClearCompletedTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const todos = getTodos();
      saveTodos(todos.filter((todo) => !todo.completed));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}

export function useClearAllTodos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      saveTodos([]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
