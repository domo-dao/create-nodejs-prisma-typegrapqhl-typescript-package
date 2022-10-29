import { Field, MiddlewareFn, ObjectType, Resolver, Root, Subscription } from 'type-graphql';

import { PubSub } from 'graphql-subscriptions';

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


export const PublishNotification: MiddlewareFn = async ({ info }, next) => {
  console.log("EUREKA")
  console.log("EUREKA")
  console.log("EUREKA")
  console.log("EUREKA")
  console.log("EUREKA")
  // Perform operation.
  const result = await next();
  // If operation fails, we won't get here.  If it succeeds, publish.
  if (info.parentType.name === 'Mutation') {
    const payload: NotificationPayload = { query: info.fieldName };
    await pubSub.publish('MUTATION', payload);
  }

  return result;
};
