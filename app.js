const assert = require("assert").strict;
const reflect = require("reflect-metadata");
assert.equal(typeof reflect, "object");

const {ApolloServer} = require("apollo-server-express");
const {resolvers} = require("./shared/graphql-permissions");
const {buildSchema} = require("type-graphql");
const {authChecker, getGraphqlContext} = require("./shared/auth");
const express = require("express");

async function startApolloServer(resolvers) {
    const app = express();
    // Build graphql Schema from exposed resolvers
    const schema = await buildSchema({
        resolvers,
        validate: false,
        authChecker
    });

    const apolloServer = new ApolloServer({
        introspection: true,
        debug: false,
        schema,
        csrfPrevention: true,
        cache: "bounded",
        context: getGraphqlContext
    });
    await apolloServer.start();

    apolloServer.applyMiddleware({app});

    // const server = app.listen(port, () => {
    app.listen(3000, () => {
        console.log(
            `🚀 Server ready at http://localhost:${3000}${apolloServer.graphqlPath}`
        );
    });
}

startApolloServer(resolvers).then(console.log).catch(console.error);

// module.exports = app;
