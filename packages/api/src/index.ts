import type { AppRouter } from "./root-router";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { appRouter } from "./root-router";
import { createORPCContext } from "./orpc";

type RouterInputs = InferRouterInputs<AppRouter>;

type RouterOutputs = InferRouterOutputs<AppRouter>;

export { createORPCContext, appRouter };
export type { AppRouter, RouterInputs, RouterOutputs };
