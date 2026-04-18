"use client";

import { Fragment, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
  AIMessage,
  AIMessageContent,
  AIResponse,
} from "@/components/ai";
import { toast } from "@repo/ui/components/sonner";
import { DefaultChatTransport } from "ai";
import { GlobeIcon, MicIcon, PlusIcon } from "lucide-react";

export type AIFormProps = {
  slug: string;
};

export const AIChatForm = ({ slug }: AIFormProps) => {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id, body }) {
        return {
          body: {
            id,
            messages,
            slug,
            ...body,
          },
        };
      },
    }),
    onError: (error) => {
      toast.error(`An error occurred, ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "streaming" || status === "submitted") {
      void stop();
    } else {
      void sendMessage({
        text: input,
      });
    }

    setInput("");
  };

  return (
    <>
      <AIConversation className="max-w-(--breakpoint-md) relative m-auto w-full flex-1 p-4">
        <AIConversationContent>
          {messages.map((message) => (
            <AIMessage from={message.role} key={message.id}>
              <AIMessageContent>
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      if (message.role === "assistant") {
                        return <AIResponse key={index}>{part.text}</AIResponse>;
                      }
                      return <Fragment key={index}>{part.text}</Fragment>;
                  }
                })}
              </AIMessageContent>
            </AIMessage>
          ))}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
      <AIInput onSubmit={handleSubmit} className="max-w-(--breakpoint-md) m-auto w-full">
        <AIInputTextarea onChange={(e) => setInput(e.target.value)} value={input} />
        <AIInputToolbar>
          <AIInputTools>
            <AIInputButton>
              <PlusIcon size={16} />
            </AIInputButton>
            <AIInputButton>
              <MicIcon size={16} />
            </AIInputButton>
            <AIInputButton>
              <GlobeIcon size={16} />
              <span>Search</span>
            </AIInputButton>
          </AIInputTools>
          <AIInputSubmit disabled={!input} status={status} />
        </AIInputToolbar>
      </AIInput>
    </>
  );
};
