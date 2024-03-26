import { NonEmptyArray } from "type-graphql";
import { createServer } from "http";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { WebSocketServer } from "ws";
import { useServer } from "graphql-ws/lib/use/ws";

const assert = require("assert").strict;
const reflect = require("reflect-metadata");
assert.equal(typeof reflect, "object");

const { ApolloServer } = require("apollo-server-express");
const { resolvers } = require("./shared/graphql");
const { buildSchema } = require("type-graphql");
const { authChecker, getGraphqlContext } = require("./shared/auth");
import { pubSub } from "./shared/graphql-subscription";
const express = require("express");

/**
 * @description - This function starts the server.
 * @param {NonEmptyArray<Function>} resolvers - Array of resolvers to be exposed by the server.
 * @returns {Promise<void>} - Nothing.
 */
async function startApp(resolvers: NonEmptyArray<Function>) {
  const app = express();
  const httpServer = createServer(app);

  // Build graphql Schema from exposed resolvers
  const schema = await buildSchema({
    resolvers: [...resolvers],
    validate: true,
    pubSub: pubSub,
    // globalMiddlewares: [ /* ... */ ],
    authChecker
  });

  // Creating the WebSocket server
  const wsServer = new WebSocketServer({
    // This is the `httpServer` we created in a previous step.
    server: httpServer,
    // Pass a different path here if app.use
    // serves expressMiddleware at a different path
    path: "/graphql"
  });

  const serverCleanup = useServer({ schema, context: getGraphqlContext }, wsServer);
  const apolloServer = new ApolloServer({
    introspection: true,
    debug: true,
    schema: schema,
    subscription: true,
    csrfPrevention: true,
    cache: "bounded",
    context: getGraphqlContext,
    plugins: [
      // Proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            }
          };
        }
      }
    ]
  });
  await apolloServer.start();

  apolloServer.applyMiddleware({ app });

  httpServer.listen(3000, () => {
    console.log(
      `🚀 Server ready at http://localhost:${3000}${apolloServer.graphqlPath}`
    );
  });
}

startApp(resolvers).then(console.log).catch(console.error);
