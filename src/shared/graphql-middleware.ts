import { MiddlewareFn } from "type-graphql";

export const TriggersResolvers: MiddlewareFn = async ({ info }, next) => {
  console.log("TriggersResolvers:before");
  const result = await next();
  console.log("TriggersResolvers:after");
  return result;
};
