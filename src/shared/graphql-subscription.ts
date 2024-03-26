import { PubSub } from 'graphql-subscriptions';

// This is a in memory Pub Sub system. It is not persistent.
// For multiple servers, you need to use a persistent Pub Sub system:
// https://github.com/GraphQLCollege/graphql-postgres-subscriptions
export const pubSub = new PubSub();