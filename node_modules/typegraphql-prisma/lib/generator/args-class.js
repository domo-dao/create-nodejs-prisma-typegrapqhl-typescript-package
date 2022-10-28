"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ts_morph_1 = require("ts-morph");
const path_1 = tslib_1.__importDefault(require("path"));
const config_1 = require("./config");
const imports_1 = require("./imports");
function generateArgsTypeClassFromArgs(project, generateDirPath, fields, argsTypeName, dmmfDocument, inputImportsLevel = 3) {
    const dirPath = path_1.default.resolve(generateDirPath, config_1.argsFolderName);
    const filePath = path_1.default.resolve(dirPath, `${argsTypeName}.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    (0, imports_1.generateTypeGraphQLImport)(sourceFile);
    (0, imports_1.generateGraphQLScalarsImport)(sourceFile);
    (0, imports_1.generateInputsImports)(sourceFile, fields
        .map(arg => arg.selectedInputType)
        .filter(argInputType => argInputType.location === "inputObjectTypes")
        .map(argInputType => argInputType.type), inputImportsLevel);
    (0, imports_1.generateEnumsImports)(sourceFile, fields
        .map(field => field.selectedInputType)
        .filter(argType => argType.location === "enumTypes")
        .map(argType => argType.type), 4);
    sourceFile.addClass({
        name: argsTypeName,
        isExported: true,
        decorators: [
            {
                name: "TypeGraphQL.ArgsType",
                arguments: [],
            },
        ],
        properties: fields.map(arg => {
            return {
                name: arg.typeName,
                type: arg.fieldTSType,
                hasExclamationToken: arg.isRequired,
                hasQuestionToken: !arg.isRequired,
                trailingTrivia: "\r\n",
                decorators: [
                    {
                        name: "TypeGraphQL.Field",
                        arguments: [
                            `_type => ${arg.typeGraphQLType}`,
                            ts_morph_1.Writers.object({
                                nullable: `${!arg.isRequired}`,
                            }),
                        ],
                    },
                ],
            };
        }),
    });
}
exports.default = generateArgsTypeClassFromArgs;
//# sourceMappingURL=args-class.js.map