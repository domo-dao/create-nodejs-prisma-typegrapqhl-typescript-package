import {
  ResolversEnhanceMap,
  FindFirstPostResolver,
  CreateOneUserResolver,
  CreateOnePostResolver,
  FindFirstUserResolver
} from "../../prisma/generated/type-graphql";
import { NonEmptyArray } from "type-graphql";
import { applyResolversEnhanceMap } from "../../prisma/generated/type-graphql";
import { userActionsConfig } from "../modules/user/permissions";

export const resolvers: NonEmptyArray<Function> = [
  FindFirstUserResolver,
  CreateOneUserResolver,
  FindFirstPostResolver,
  CreateOnePostResolver,
];

export const resolversEnhanceMap: ResolversEnhanceMap = {
  User: userActionsConfig
};

applyResolversEnhanceMap(resolversEnhanceMap);
