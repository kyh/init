"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { GlobeIcon, MicIcon, PlusIcon, SendIcon } from "lucide-react";

import { useTRPC } from "@/trpc/react";
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "./ai-input";

export type AIFormProps = {
  teamSlug: string;
};

export const AIForm = ({ teamSlug }: AIFormProps) => {
  const trpc = useTRPC();
  const {
    data: { team },
  } = useSuspenseQuery(trpc.team.getTeam.queryOptions({ slug: teamSlug }));

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message");
    console.log("Submitted message:", message);
  };

  return (
    <section className="flex flex-1 items-end justify-center gap-4 p-8">
      <AIInput onSubmit={handleSubmit}>
        <AIInputTextarea />
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
          <AIInputSubmit>
            <SendIcon size={16} />
          </AIInputSubmit>
        </AIInputToolbar>
      </AIInput>
    </section>
  );
};
