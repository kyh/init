import type { AppRouter } from "./root-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import { appRouter } from "./root-router";
import { createTRPCContext } from "./trpc";

/**
 * Inference helpers for input types
 * @example
 * type CreateTodoInput = RouterInputs['todo']['create']
 *      ^? { slug: string; title: string }
 **/
type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type OrganizationOutput = RouterOutputs['organization']['get']
 **/
type RouterOutputs = inferRouterOutputs<AppRouter>;

export { createTRPCContext, appRouter };
export type { AppRouter, RouterInputs, RouterOutputs };
