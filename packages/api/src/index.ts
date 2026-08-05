import type { AppRouter } from "./root-router";
import type { inferRouterInputs, inferRouterOutputs } from "@trpc/server";
import type { FlagName, Flags } from "./flags/flags";
import { flagDefaults, flags } from "./flags/flags";
import { REQUEST_ID_HEADER } from "./observability/logger";
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

export { createTRPCContext, appRouter, flagDefaults, flags, REQUEST_ID_HEADER };
export type { AppRouter, RouterInputs, RouterOutputs, FlagName, Flags };
