import type { UIMessage } from "ai";
import { getOrganization } from "@repo/api/auth/auth";
import { convertToModelMessages, smoothStream, streamText } from "ai";

export const maxDuration = 30;

export async function POST(request: Request) {
  const { messages, slug } = (await request.json()) as {
    messages: UIMessage[];
    slug: string;
  };

  const organization = await getOrganization({ organizationSlug: slug });
  if (!organization) {
    return new Response("Organization not found", { status: 404 });
  }

  const result = streamText({
    model: "gpt-4o-mini",
    messages: convertToModelMessages(messages),
    experimental_transform: smoothStream({ chunking: "word" }),
  });

  return result.toUIMessageStreamResponse();
}
