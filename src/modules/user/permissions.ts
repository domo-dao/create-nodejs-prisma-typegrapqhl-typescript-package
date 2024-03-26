import { Authorized, ResolverData, UseMiddleware } from "type-graphql";
import { ResolverActionsConfig } from "../../../prisma/generated/type-graphql";
import { PermissionFunction } from "../../shared/base-permissions";
import { GraphqlContext } from "shared/auth-types";

const basePermission = async (resolverData: ResolverData<GraphqlContext>): Promise<boolean> => {
  console.log("basePermission:", resolverData);
  // TODO: hasPermission helper
  return true;
};

export const userActionsConfig: ResolverActionsConfig<"User"> = {
  findFirstUser: [Authorized<PermissionFunction>(basePermission), UseMiddleware((_data, next) => {
    console.log("findFirstUser:before");
    const result = next();
    console.log("findFirstUser:after");
    return result;
  })],
  createOneUser: [Authorized<PermissionFunction>(basePermission)]
};
