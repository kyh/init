import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

type TodoStore = {
  todos: Todo[];
  addTodo: (title: string) => void;
  updateTodo: (id: string, updates: Partial<Omit<Todo, "id">>) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
};

export const useTodoStore = create<TodoStore>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (title) =>
        set((state) => ({
          todos: [
            ...state.todos,
            {
              id: crypto.randomUUID(),
              title,
              completed: false,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      updateTodo: (id, updates) =>
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id ? { ...todo, ...updates } : todo,
          ),
        })),
      deleteTodo: (id) =>
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        })),
      clearCompleted: () =>
        set((state) => ({
          todos: state.todos.filter((todo) => !todo.completed),
        })),
    }),
    {
      name: "todo-storage",
    },
  ),
);
