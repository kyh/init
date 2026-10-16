import { generateOpenAPIDocument } from "@/orpc/openapi";

// No request data is read, so Cache Components prerenders the document at build time.
export const GET = async () => Response.json(await generateOpenAPIDocument());
