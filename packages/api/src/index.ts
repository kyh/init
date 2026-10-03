import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "./root-router";

export { REQUEST_ID_HEADER, resolveRequestId } from "./observability/logger";
export { createORPCContext, type ORPCContext } from "./orpc";
export { type AppRouter, appRouter } from "./root-router";

export type RouterInputs = InferRouterInputs<AppRouter>;

export type RouterOutputs = InferRouterOutputs<AppRouter>;
