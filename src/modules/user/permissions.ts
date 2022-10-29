import { Authorized, ResolverData } from "type-graphql";
import { ResolverActionsConfig } from "../../../prisma/generated/type-graphql";
import { PermissionFunction } from "../../shared/base-permissions";
import { GraphqlContext } from "../../shared/auth";

const basePermission = async (resolverData: ResolverData<GraphqlContext>): Promise<boolean> => {
  console.log("basePermission:", resolverData);
  // TODO: hasPermission helper
  return true;
};

export const userActionsConfig: ResolverActionsConfig<"User"> = {
  aggregateUser: [Authorized<PermissionFunction>(basePermission)],
  findFirstUser: [Authorized<PermissionFunction>(basePermission)]
};
