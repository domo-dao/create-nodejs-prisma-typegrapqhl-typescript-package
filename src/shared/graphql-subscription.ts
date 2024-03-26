/* eslint-disable */
import { PubSub } from 'graphql-subscriptions';
import {
  Arg,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  Subscription,
  Field,
  ObjectType,
  ID,
} from 'type-graphql';

// This is a in memory Pub Sub system. It is not persistent.
// For multiple servers, you need to use a persistent Pub Sub system:
// https://github.com/GraphQLCollege/graphql-postgres-subscriptions
export const pubSub = new PubSub();

/**
 * You can delete this code subscription example below.
 * If you do, remember to remove the notification resolver from
 * the graphql array in the graphql.ts file to prevent errors.
 */

@ObjectType()
export class Notification {
  @Field((_type) => ID)
  id!: number;

  @Field({ nullable: true })
  message?: string;

  @Field((_type) => Date)
  date!: Date;
}

export interface NotificationPayload {
  id: number;

  message?: string;
}

export const enum Topic {
  NOTIFICATIONS = 'NOTIFICATIONS',
  DYNAMIC_ID_TOPIC = 'DYNAMIC_ID_TOPIC',
}

@Resolver()
export class NotificationResolver {
  private id: number = 0;

  @Query((_returns) => Date)
  currentDate() {
    return new Date();
  }

  @Mutation((_returns) => Boolean)
  async pubSubMutation(
    @Arg('message', { nullable: true }) message?: string,
  ): Promise<boolean> {
    this.id += 1;
    const payload: NotificationPayload = { id: this.id, message };
    pubSub.publish(Topic.NOTIFICATIONS, payload);
    return true;
  }

  @Subscription({ topics: Topic.NOTIFICATIONS })
  normalSubscription(
    @Root() { id, message }: NotificationPayload,
  ): Notification {
    return { id, message, date: new Date() };
  }

  // Dynamic topic

  @Mutation(() => Boolean)
  async publishToDynamicTopic(
    @Arg('topic') topic: string,
    @Arg('message', { nullable: true }) message?: string,
  ): Promise<boolean> {
    this.id += 1;
    const payload: NotificationPayload = { id: this.id, message };
    pubSub.publish(topic, payload);
    return true;
  }

  @Subscription({
    topics: ({ args }) => args.topic,
  })
  subscribeToTopicFromArg(
    @Arg('topic') _topic: string,
    @Root() { id, message }: NotificationPayload,
  ): Notification {
    return { id, message, date: new Date() };
  }

  // Dynamic topic id

  @Mutation(() => Boolean)
  async publishWithDynamicTopicId(
    @Arg('topicId', () => Int) topicId: number,
    @Arg('message', { nullable: true }) message?: string,
  ): Promise<boolean> {
    this.id += 1;
    const payload: NotificationPayload = { id: this.id, message };
    pubSub.publish(Topic.DYNAMIC_ID_TOPIC, { topicId, payload });
    return true;
  }
}
