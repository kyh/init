"use client";

import { useChat } from "@ai-sdk/react";
import { Button } from "@init/ui/button";
import { toast } from "@init/ui/toast";
import { ArrowUp, Square } from "lucide-react";

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
  const {
    messages,
    input,
    setInput,
    handleSubmit: sendMessage,
    status,
    stop,
  } = useChat({
    body: { teamSlug },
    onError: (error) => {
      toast.error(`An error occurred, ${error.message}`);
    },
  });

  const handleSubmit = () => {
    if (status === "streaming") {
      stop();
    } else {
      sendMessage();
    }
  };

  return (
    <>
      <MessagesContainer className="m-auto w-full max-w-(--breakpoint-md) flex-1 space-y-4 p-4">
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
        onSubmit={handleSubmit}
        className="m-auto w-full max-w-(--breakpoint-md)"
      >
        <PromptInputTextarea placeholder="Ask me anything..." />
        <PromptInputActions className="flex items-center justify-between gap-2 pt-2">
          <PromptInputAction
            tooltip={
              status === "streaming" ? "Stop generation" : "Send message"
            }
          >
            <Button
              size="icon"
              className="ml-auto h-8 w-8 rounded-full"
              onClick={handleSubmit}
            >
              {status === "streaming" ? (
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
