import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type ChatStatus = "ready" | "streaming" | "submitted";

type ChatStore = {
  messages: ChatMessage[];
  status: ChatStatus;
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  setStatus: (status: ChatStatus) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set) => ({
      messages: [],
      status: "ready",
      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),
      clearMessages: () => set({ messages: [] }),
      setStatus: (status) => set({ status }),
    }),
    {
      name: "chat-storage",
    },
  ),
);
