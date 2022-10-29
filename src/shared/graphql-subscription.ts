import { Field, MiddlewareFn, ObjectType, Resolver, Root, Subscription } from 'type-graphql';

import { PubSub } from 'graphql-subscriptions';

// This is a in memory Pub Sub system. It is not persistent.
// For multiple servers, you need to use a persistent Pub Sub system:
// https://github.com/GraphQLCollege/graphql-postgres-subscriptions
//
export const pubSub = new PubSub();

@ObjectType()
export class Notification {
  @Field((type) => String)
  query: string | undefined;

  @Field((type) => Date)
  date: Date | undefined;
}

interface NotificationPayload {
  query: string;
}

@Resolver()
export class SubscriptionResolver {
  @Subscription({
    topics: 'MUTATION',
  })
  mutationNotification(@Root() notificationPayload: NotificationPayload): Notification {
    return {
      ...notificationPayload,
      date: new Date(),
    };
  }
}


export const PublishNotificationMiddleware: MiddlewareFn = async ({ info }, next) => {
  // Perform operation.
  const result = await next();
  // If operation fails, we won't get here.  If it succeeds, publish.
  if (info.parentType.name === 'Mutation') {
    const payload: NotificationPayload = { query: info.fieldName };
    await pubSub.publish('MUTATION', payload);
  }

  return result;
};
