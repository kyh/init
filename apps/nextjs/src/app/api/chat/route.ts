import type { Message } from "ai";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

import { caller } from "@/trpc/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages, teamSlug } = (await request.json()) as {
    messages: Message[];
    teamSlug: string;
  };
  await caller.team.getTeam({ slug: teamSlug });

  const result = streamText({
    model: openai("gpt-3.5-turbo"),
    messages,
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      console.error(error);
      return "An error occurred while processing the messages";
    },
  });
}
