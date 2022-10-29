import {
  FindFirstPostResolver,
  FindFirstUserResolver, ResolversEnhanceMap,
  CreateOneUserResolver
} from "../../prisma/generated/type-graphql";
import { NonEmptyArray } from "type-graphql";
import { applyResolversEnhanceMap } from "../../prisma/generated/type-graphql";
// @ts-ignore
import { userActionsConfig } from "../modules/user/permissions";

export const resolvers: NonEmptyArray<Function> = [
  // User
  FindFirstPostResolver,
  CreateOneUserResolver,
  // POST
  FindFirstUserResolver

];

export const resolversEnhanceMap: ResolversEnhanceMap = {
  User: userActionsConfig
};

applyResolversEnhanceMap(resolversEnhanceMap);
