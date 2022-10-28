"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const path_1 = tslib_1.__importDefault(require("path"));
const imports_1 = require("./imports");
const config_1 = require("./config");
const helpers_1 = require("./helpers");
function generateEnumFromDef(project, baseDirPath, enumDef) {
    const dirPath = path_1.default.resolve(baseDirPath, config_1.enumsFolderName);
    const filePath = path_1.default.resolve(dirPath, `${enumDef.typeName}.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    (0, imports_1.generateTypeGraphQLImport)(sourceFile);
    sourceFile.addEnum({
        isExported: true,
        name: enumDef.typeName,
        ...(enumDef.docs && {
            docs: [{ description: (0, helpers_1.convertNewLines)(enumDef.docs) }],
        }),
        members: enumDef.valuesMap.map(({ name, value }) => ({
            name,
            value,
            // TODO: add support for string enums (values)
            // TODO: add support for enum members docs
        })),
    });
    // TODO: refactor to AST
    sourceFile.addStatements([
        `TypeGraphQL.registerEnumType(${enumDef.typeName}, {
      name: "${enumDef.typeName}",
      description: ${enumDef.docs ? `"${enumDef.docs}"` : "undefined"},
    });`,
    ]);
}
exports.default = generateEnumFromDef;
//# sourceMappingURL=enum.js.map