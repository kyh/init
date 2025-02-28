"use client";

import { useState } from "react";
import { Button } from "@init/ui/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowUp, Paperclip, Square, X } from "lucide-react";

import { useTRPC } from "@/trpc/react";
import {
  PromptInput,
  PromptInputAction,
  PromptInputActions,
  PromptInputTextarea,
} from "./ai-chat-input";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessagesContainer,
} from "./ai-chat-message";

export type AIFormProps = {
  teamSlug: string;
};

export const AIChatForm = ({ teamSlug }: AIFormProps) => {
  const trpc = useTRPC();
  const {
    data: { team },
  } = useSuspenseQuery(trpc.team.getTeam.queryOptions({ slug: teamSlug }));

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "user",
      content: "Hello! Can you help me with a coding question?",
    },
    {
      id: 2,
      role: "assistant",
      content:
        "Of course! I'd be happy to help with your coding question. What would you like to know?",
    },
    {
      id: 3,
      role: "user",
      content: "How do I create a responsive layout with CSS Grid?",
    },
    {
      id: 4,
      role: "assistant",
      content:
        "Creating a responsive layout with CSS Grid is straightforward. Here's a basic example:\n\n```css\n.container {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));\n  gap: 1rem;\n}\n```\n\nThis creates a grid where:\n- Columns automatically fit as many as possible\n- Each column is at least 250px wide\n- Columns expand to fill available space\n- There's a 1rem gap between items\n\nWould you like me to explain more about how this works?",
    },
  ]);

  const handleSubmit = () => {
    if (input.trim() || files.length > 0) {
      setInput("");
      setFiles([]);
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          role: "user",
          content: input,
        },
      ]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <MessagesContainer className="m-auto flex-1 space-y-4 p-4">
        {messages.map((message) => {
          const isAssistant = message.role === "assistant";
          return (
            <Message
              key={message.id}
              className={
                message.role === "user" ? "justify-end" : "justify-start"
              }
            >
              {isAssistant && (
                <MessageAvatar
                  src="/avatars/ai.png"
                  alt="AI Assistant"
                  fallback="AI"
                />
              )}
              <div className="max-w-[85%] flex-1 sm:max-w-[75%]">
                {isAssistant ? (
                  <div className="bg-secondary text-foreground prose rounded-lg p-2">
                    {message.content}
                  </div>
                ) : (
                  <MessageContent className="bg-primary text-primary-foreground">
                    {message.content}
                  </MessageContent>
                )}
              </div>
            </Message>
          );
        })}
      </MessagesContainer>
      <PromptInput
        value={input}
        onValueChange={setInput}
        isLoading={isLoading}
        onSubmit={handleSubmit}
        className="m-auto w-full max-w-(--breakpoint-md)"
      >
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 pb-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
              >
                <Paperclip className="size-4" />
                <span className="max-w-[120px] truncate">{file.name}</span>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="hover:bg-secondary/50 rounded-full p-1"
                >
                  <X className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <PromptInputTextarea placeholder="Ask me anything..." />
        <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
          <PromptInputAction tooltip="Attach files">
            <label
              htmlFor="file-upload"
              className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
            >
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
              />
              <Paperclip className="text-primary size-5" />
            </label>
          </PromptInputAction>
          <PromptInputAction
            tooltip={isLoading ? "Stop generation" : "Send message"}
          >
            <Button
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
            >
              {isLoading ? (
                <Square className="size-5 fill-current" />
              ) : (
                <ArrowUp className="size-5" />
              )}
            </Button>
          </PromptInputAction>
        </PromptInputActions>
      </PromptInput>
    </>
  );
};
