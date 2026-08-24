import type { AppRouter } from "./root-router";
import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { appRouter } from "./root-router";
import { isUntrustedOrigin } from "./origin-guard";
import { createORPCContext } from "./orpc";

/**
 * Inference helpers for input types
 * @example
 * type CreateTodoInput = RouterInputs['todo']['create']
 *      ^? { slug: string; title: string }
 **/
type RouterInputs = InferRouterInputs<AppRouter>;

/**
 * Inference helpers for output types
 * @example
 * type OrganizationOutput = RouterOutputs['organization']['get']
 **/
type RouterOutputs = InferRouterOutputs<AppRouter>;

export { createORPCContext, appRouter, isUntrustedOrigin };
export type { AppRouter, RouterInputs, RouterOutputs };
