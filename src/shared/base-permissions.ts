/* eslint-disable no-unused-vars */
import { ResolverData } from 'type-graphql';
import { GraphqlContext } from './auth-types';

export enum PERMISSION {
  CREATE_PATIENT,
  READ_PATIENT_INDEX,
}

export type PermissionFunction = (resolverData: ResolverData<GraphqlContext>) => Promise<boolean>;
