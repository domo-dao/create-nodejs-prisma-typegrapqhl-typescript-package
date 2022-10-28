"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const generator_helper_1 = require("@prisma/generator-helper");
const prisma_generator_1 = require("./prisma-generator");
(0, generator_helper_1.generatorHandler)({
    onManifest: () => ({
        defaultOutput: "node_modules/@generated/type-graphql",
        prettyName: "TypeGraphQL integration",
        requiresGenerators: ["prisma-client-js"],
    }),
    onGenerate: prisma_generator_1.generate,
});
//# sourceMappingURL=generator.js.map