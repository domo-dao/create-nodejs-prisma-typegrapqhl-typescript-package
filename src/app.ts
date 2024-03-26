import 'reflect-metadata';
import { ApolloServer } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { expressMiddleware } from '@apollo/server/express4';
import { NonEmptyArray, buildSchema } from 'type-graphql';
import { resolvers } from './shared/graphql';
import { pubSub } from './shared/graphql-subscription';
import { useServer } from 'graphql-ws/lib/use/ws';
import { authChecker, getGraphqlContext } from './shared/auth';
import { WebSocketServer } from 'ws';
import express from 'express';
import http from 'http';

/**
 * @description - This function starts the server.
 * @param {NonEmptyArray<Function>} resolvers - Array of resolvers to be exposed by the server.
 * @returns {Promise<void>} - Nothing.
 */
async function startApp(resolvers: NonEmptyArray<Function>) {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json());

  const schema = await buildSchema({
    resolvers,
    validate: true,
    pubSub,
    authChecker,
  });

  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });
  const serverCleanup = useServer(
    { schema, context: getGraphqlContext },
    wsServer,
  );

  const server = new ApolloServer({
    introspection: true,
    schema,
    csrfPrevention: true,
    cache: 'bounded',
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
  });

  await server.start();
  app.use(
    expressMiddleware(server, {
      context: getGraphqlContext,
    }),
  );

  httpServer.listen(4000, () => {
    console.log(`🚀 Server ready at http://localhost:4000/graphql`);
    console.log(`🔔 Subscriptions ready at ws://localhost:4000/graphql`);
  });
}

startApp(resolvers).then(console.log).catch(console.error);
