"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCustomScalars = void 0;
const imports_1 = require("./imports");
function generateCustomScalars(sourceFile, options) {
    (0, imports_1.generatePrismaNamespaceImport)(sourceFile, options);
    (0, imports_1.generateGraphQLScalarTypeImport)(sourceFile);
    sourceFile.addStatements(/* ts */ `
    export const DecimalJSScalar = new GraphQLScalarType({
      name: "Decimal",
      description: "GraphQL Scalar representing the Prisma.Decimal type, based on Decimal.js library.",
      serialize: (value: unknown) => {
        if (!(Prisma.Decimal.isDecimal(value))) {
          throw new Error(\`[DecimalError] Invalid argument: \${Object.prototype.toString.call(value)}. Expected Prisma.Decimal.\`);
        }
        return (value as Prisma.Decimal).toString();
      },
      parseValue: (value: unknown) => {
        if (!(typeof value === "string")) {
          throw new Error(\`[DecimalError] Invalid argument: \${typeof value}. Expected string.\`);
        }
        return new Prisma.Decimal(value);
      },
    });
  `);
}
exports.generateCustomScalars = generateCustomScalars;
//# sourceMappingURL=generate-scalars.js.map