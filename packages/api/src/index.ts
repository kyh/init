import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import type { AppRouter } from "./root-router";

export { type FlagName, type Flags, flagDefaults, flags } from "./flags/flags";
export { REQUEST_ID_HEADER, resolveRequestId } from "./observability/logger";
export { createORPCContext } from "./orpc";
export { type AppRouter, appRouter } from "./root-router";

export type RouterInputs = InferRouterInputs<AppRouter>;

export type RouterOutputs = InferRouterOutputs<AppRouter>;
