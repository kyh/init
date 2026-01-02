import { Fragment, useState } from "react";
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
} from "@repo/ui/ai";
import { toast } from "@repo/ui/toast";
import { GlobeIcon, MicIcon, PlusIcon } from "lucide-react";

import { PageHeader } from "../components/page-header";
import { useChatStore } from "../lib/stores/chat-store";

export function HomePage() {
  const [input, setInput] = useState("");
  const { messages, addMessage, status, setStatus } = useChatStore();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedInput = input.trim();
    if (!trimmedInput) return;

    if (status === "streaming") {
      setStatus("ready");
      return;
    }

    // Add user message
    addMessage({
      id: crypto.randomUUID(),
      role: "user",
      content: trimmedInput,
    });

    setInput("");
    setStatus("streaming");

    // Simulate AI response (in a real app, this would call an API)
    setTimeout(() => {
      addMessage({
        id: crypto.randomUUID(),
        role: "assistant",
        content: `This is a simulated response to: "${trimmedInput}"\n\nIn a production environment, this would connect to an AI service like OpenAI to generate real responses.`,
      });
      setStatus("ready");
    }, 1000);
  };

  return (
    <div className="flex h-full flex-col px-5">
      <PageHeader>Welcome back</PageHeader>
      <AIConversation className="relative m-auto w-full max-w-2xl flex-1 p-4">
        <AIConversationContent>
          {messages.length === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-center">
              <p>Start a conversation by typing a message below.</p>
            </div>
          ) : (
            messages.map((message) => (
              <AIMessage from={message.role} key={message.id}>
                <AIMessageContent>
                  {message.role === "assistant" ? (
                    <AIResponse>{message.content}</AIResponse>
                  ) : (
                    <Fragment>{message.content}</Fragment>
                  )}
                </AIMessageContent>
              </AIMessage>
            ))
          )}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
      <AIInput onSubmit={handleSubmit} className="m-auto w-full max-w-2xl pb-5">
        <AIInputTextarea
          onChange={(e) => setInput(e.target.value)}
          value={input}
          placeholder="Type your message..."
        />
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
          <AIInputSubmit disabled={!input.trim()} status={status} />
        </AIInputToolbar>
      </AIInput>
    </div>
  );
}
