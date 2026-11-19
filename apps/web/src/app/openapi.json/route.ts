import { generateOpenAPIDocument } from "@/orpc/openapi";

export const GET = async () => Response.json(await generateOpenAPIDocument());
