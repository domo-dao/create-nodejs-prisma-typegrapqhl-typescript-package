import { PrismaClient } from "@prisma/client";
import { AuthChecker, ResolverData } from "type-graphql";
import JwksRsa, { SigningKey } from "jwks-rsa";
import * as jwt from "jsonwebtoken";
import { User } from "../../prisma/generated/type-graphql/models/User";
import { getOrCreateSessionUser } from "../modules/user/services";
import { AUTH0_AUDIENCE, AUTH0_EMAIL_CLAIM, AUTH0_ISSUER_BASE_URL } from "./environment";
import { PRISMA } from "./db";
import { PermissionFunction } from "./base-permissions";

const jwksClient = JwksRsa({
  cache: true,
  cacheMaxAge: 60 * 60 * 24 * 30,
  jwksUri: `${AUTH0_ISSUER_BASE_URL}.well-known/jwks.json`
});

let signingKeys: SigningKey[] = [];
jwksClient
  .getSigningKeys()
  .then((keys) => {
    signingKeys = keys;
  })
  .catch(console.error);

export class CustomAuthChecker implements AuthCheckerInterface<GraphqlContext, PermissionFunction> {
  async check(
    resolverData: ResolverData<GraphqlContext>,
    permissions: PermissionFunction[]
  ): Promise<boolean> {
    const { root, args, context, info } = resolverData;
    console.log("CustomAuthChecker:context.user:", context.user);
    if (context.user === null) return true;

    if (context.user == null) {
      return false;
    }

    console.log("authChecker:", root);
    console.log("authChecker:", args, info.path, permissions);
    console.log("authChecker:context:auth0user", context.auth0User);
    console.log("authChecker:user:", context.user);

    if (!context.user.isActive) {
      return false;
    }

    if (permissions.length === 0) {
      return true;
    }

    for (let i = 0, j = permissions.length; i < j; i++) {
      const permission = permissions[i];
      const hasAccess = await permission(resolverData);
      // TODO: Revert this. If any is false, return false
      if (hasAccess) {
        return true;
      }
    }
    // no permissions matched, restrict access
    return false;
  }
}

export const authChecker: AuthChecker<GraphqlContext, PermissionFunction> = async (
  { root, args, context, info },
  permissions
) => {
  return await new CustomAuthChecker().check({ root, args, context, info }, permissions);
};


const getAuth0UserFromToken = (authorizationHeader: string): Auth0User | null => {
  if (authorizationHeader === "") {
    return null;
  }
  if (signingKeys.length === 0) {
    return null;
  }

  const [tokenPrefix, token] = authorizationHeader.split(" ");

  if (tokenPrefix !== "Bearer") {
    return null;
  }

  if (token === undefined || token === "") {
    return null;
  }

  for (let i = 0, j = signingKeys.length; i < j; i++) {
    const key = signingKeys[i];
    try {
      jwt.verify(token, key.getPublicKey(), {
        issuer: AUTH0_ISSUER_BASE_URL,
        audience: AUTH0_AUDIENCE,
        ignoreExpiration: false
      });
    } catch (err: any) {
      continue;
    }
    const decode: DecodedAccessToken = jwt.decode(token) as DecodedAccessToken;
    return {
      auth0_id: decode.sub,
      email: decode[AUTH0_EMAIL_CLAIM],
      isActive: true
    };
  }
  return null;
};

// @ts-expect-error
export const getGraphqlContext = async ({ req }): Promise<GraphqlContext> => {
  let auth0User = null;
  let user = null;
  if (req.headers.authorization !== undefined) {
    auth0User = getAuth0UserFromToken(req.headers.authorization);
    if (auth0User !== null) {
      user = await getOrCreateSessionUser(auth0User);
    }
  }
  return { prisma: PRISMA, auth0User, user };
};

export interface Auth0User {
  auth0_id: string;
  email: string;
  isActive: boolean;
}

export interface DecodedAccessToken extends Record<string, string> {
  sub: string;
}

export interface AuthCheckerInterface<TContextType = {}, TRoleType = string> {
  check: (
    resolverData: ResolverData<TContextType>,
    roles: TRoleType[]
  ) => boolean | Promise<boolean>;
}

export interface GraphqlContext {
  prisma: PrismaClient;
  auth0User: Auth0User | null;
  user: User | null;
}
