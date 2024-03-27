/* eslint-disable no-unused-vars */
import { PrismaClient } from '@prisma/client';
import { ResolverData } from 'type-graphql';
import { User } from '../../prisma/generated/type-graphql';

export interface GraphqlContextParams {
  req?: { headers?: { authorization?: string } };
  connectionParams?: { Authorization?: string };
}

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
    roles: TRoleType[],
  ) => boolean | Promise<boolean>;
}

export interface GraphqlContext {
  prisma: PrismaClient;
  auth0User: Auth0User | null;
  user: User | null;
}
