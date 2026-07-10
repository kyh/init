import { getOrganization } from "@repo/api/auth/auth";
import { convertToModelMessages, smoothStream, streamText, validateUIMessages } from "ai";
import { APIError } from "better-auth/api";
import { z } from "zod";

export const maxDuration = 30;

const chatRequestSchema = z.object({
  messages: z.array(z.unknown()),
  slug: z.string(),
});

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response("Invalid request body", { status: 400 });
  }
  const { slug } = parsed.data;

  let organization;
  try {
    // Throws UNAUTHORIZED without a session, FORBIDDEN for non-members
    organization = await getOrganization({ organizationSlug: slug });
  } catch (error) {
    if (error instanceof APIError) {
      return new Response(error.message, { status: error.statusCode });
    }
    throw error;
  }
  if (!organization) {
    return new Response("Organization not found", { status: 404 });
  }

  const messages = await validateUIMessages({ messages: parsed.data.messages });

  const result = streamText({
    // Bare model ids resolve through the Vercel AI Gateway, which requires
    // creator-prefixed ids (and AI_GATEWAY_API_KEY at runtime)
    model: "openai/gpt-4o-mini",
    messages: await convertToModelMessages(messages),
    experimental_transform: smoothStream({ chunking: "word" }),
  });

  return result.toUIMessageStreamResponse();
}
