"use client";

import { Fragment } from "react";
import { useChat } from "@ai-sdk/react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@repo/ui/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@repo/ui/components/ai-elements/message";
import {
  PromptInput,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from "@repo/ui/components/ai-elements/prompt-input";
import { toast } from "@repo/ui/components/sonner";
import { DefaultChatTransport } from "ai";
import { GlobeIcon, MicIcon, PlusIcon } from "lucide-react";

export type AIFormProps = {
  slug: string;
};

export const AIChatForm = ({ slug }: AIFormProps) => {
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

  return (
    <>
      <Conversation className="max-w-(--breakpoint-md) relative m-auto w-full flex-1 p-4">
        <ConversationContent>
          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  switch (part.type) {
                    case "text":
                      if (message.role === "assistant") {
                        return <MessageResponse key={index}>{part.text}</MessageResponse>;
                      }
                      return <Fragment key={index}>{part.text}</Fragment>;
                  }
                })}
              </MessageContent>
            </Message>
          ))}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <PromptInput
        onSubmit={(message) => {
          if (status === "streaming" || status === "submitted") {
            void stop();
            return;
          }
          void sendMessage({ text: message.text });
        }}
        className="max-w-(--breakpoint-md) m-auto w-full"
      >
        <PromptInputTextarea />
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton>
              <PlusIcon size={16} />
            </PromptInputButton>
            <PromptInputButton>
              <MicIcon size={16} />
            </PromptInputButton>
            <PromptInputButton>
              <GlobeIcon size={16} />
              <span>Search</span>
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit status={status} onStop={() => void stop()} />
        </PromptInputFooter>
      </PromptInput>
    </>
  );
};
