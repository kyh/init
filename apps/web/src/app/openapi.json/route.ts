import { generateOpenAPIDocument } from "@/orpc/openapi";

export const dynamic = "force-static";

export const GET = async () => Response.json(await generateOpenAPIDocument());
