import type {
  InferContractRouterInputs,
  InferContractRouterOutputs,
  RouterContractClient,
} from "@orpc/contract";

import { organizationContract } from "./organization/organization-contract";
import { todoContract } from "./todo/todo-contract";
import { waitlistContract } from "./waitlist/waitlist-contract";

/** The API's single source of truth: @repo/service implements it, clients type against it. */
export const contract = {
  organization: organizationContract,
  todo: todoContract,
  waitlist: waitlistContract,
};

export type Contract = typeof contract;

export type ContractClient = RouterContractClient<Contract>;

export type RouterInputs = InferContractRouterInputs<Contract>;

export type RouterOutputs = InferContractRouterOutputs<Contract>;
