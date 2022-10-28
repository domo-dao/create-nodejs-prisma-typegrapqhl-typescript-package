"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateInputTypeClassFromType = exports.generateOutputTypeClassFromType = void 0;
const tslib_1 = require("tslib");
const ts_morph_1 = require("ts-morph");
const path_1 = tslib_1.__importDefault(require("path"));
const config_1 = require("./config");
const imports_1 = require("./imports");
function generateOutputTypeClassFromType(project, dirPath, type, dmmfDocument) {
    const fileDirPath = path_1.default.resolve(dirPath, config_1.outputsFolderName);
    const filePath = path_1.default.resolve(fileDirPath, `${type.typeName}.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    const fieldArgsTypeNames = type.fields
        .filter(it => it.argsTypeName)
        .map(it => it.argsTypeName);
    (0, imports_1.generateTypeGraphQLImport)(sourceFile);
    (0, imports_1.generateGraphQLScalarsImport)(sourceFile);
    (0, imports_1.generatePrismaNamespaceImport)(sourceFile, dmmfDocument.options, 2);
    (0, imports_1.generateCustomScalarsImport)(sourceFile, 2);
    (0, imports_1.generateArgsImports)(sourceFile, fieldArgsTypeNames, 0);
    (0, imports_1.generateOutputsImports)(sourceFile, type.fields
        .filter(field => field.outputType.location === "outputObjectTypes")
        .map(field => field.outputType.type), 1);
    (0, imports_1.generateEnumsImports)(sourceFile, type.fields
        .map(field => field.outputType)
        .filter(fieldType => fieldType.location === "enumTypes")
        .map(fieldType => fieldType.type), 2);
    sourceFile.addClass({
        name: type.typeName,
        isExported: true,
        decorators: [
            {
                name: "TypeGraphQL.ObjectType",
                arguments: [
                    `"${type.typeName}"`,
                    ts_morph_1.Writers.object({
                        isAbstract: "true",
                        ...(dmmfDocument.options.simpleResolvers && {
                            simpleResolvers: "true",
                        }),
                    }),
                ],
            },
        ],
        properties: type.fields.map(field => ({
            name: field.name,
            type: field.fieldTSType,
            hasExclamationToken: true,
            hasQuestionToken: false,
            trailingTrivia: "\r\n",
            decorators: [
                {
                    name: "TypeGraphQL.Field",
                    arguments: [
                        `_type => ${field.typeGraphQLType}`,
                        ts_morph_1.Writers.object({
                            nullable: `${!field.isRequired}`,
                        }),
                    ],
                },
            ],
        })),
    });
}
exports.generateOutputTypeClassFromType = generateOutputTypeClassFromType;
function generateInputTypeClassFromType(project, dirPath, inputType, _dmmfDocument, options) {
    const filePath = path_1.default.resolve(dirPath, config_1.inputsFolderName, `${inputType.typeName}.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    (0, imports_1.generateTypeGraphQLImport)(sourceFile);
    (0, imports_1.generateGraphQLScalarsImport)(sourceFile);
    (0, imports_1.generatePrismaNamespaceImport)(sourceFile, options, 2);
    (0, imports_1.generateCustomScalarsImport)(sourceFile, 2);
    (0, imports_1.generateInputsImports)(sourceFile, inputType.fields
        .filter(field => field.selectedInputType.location === "inputObjectTypes")
        .map(field => field.selectedInputType.type)
        .filter(fieldType => fieldType !== inputType.typeName));
    (0, imports_1.generateEnumsImports)(sourceFile, inputType.fields
        .map(field => field.selectedInputType)
        .filter(fieldType => fieldType.location === "enumTypes")
        .map(fieldType => fieldType.type), 2);
    const fieldsToEmit = inputType.fields.filter(field => !field.isOmitted);
    const mappedFields = fieldsToEmit.filter(field => field.hasMappedName);
    sourceFile.addClass({
        name: inputType.typeName,
        isExported: true,
        decorators: [
            {
                name: "TypeGraphQL.InputType",
                arguments: [
                    `"${inputType.typeName}"`,
                    ts_morph_1.Writers.object({
                        isAbstract: "true",
                    }),
                ],
            },
        ],
        properties: fieldsToEmit.map(field => {
            return {
                name: field.name,
                type: field.fieldTSType,
                hasExclamationToken: !!field.isRequired,
                hasQuestionToken: !field.isRequired,
                trailingTrivia: "\r\n",
                decorators: field.hasMappedName
                    ? []
                    : [
                        {
                            name: "TypeGraphQL.Field",
                            arguments: [
                                `_type => ${field.typeGraphQLType}`,
                                ts_morph_1.Writers.object({
                                    nullable: `${!field.isRequired}`,
                                }),
                            ],
                        },
                    ],
            };
        }),
        getAccessors: mappedFields.map(field => {
            return {
                name: field.typeName,
                type: field.fieldTSType,
                hasExclamationToken: field.isRequired,
                hasQuestionToken: !field.isRequired,
                trailingTrivia: "\r\n",
                statements: [`return this.${field.name};`],
                decorators: [
                    {
                        name: "TypeGraphQL.Field",
                        arguments: [
                            `_type => ${field.typeGraphQLType}`,
                            ts_morph_1.Writers.object({
                                nullable: `${!field.isRequired}`,
                            }),
                        ],
                    },
                ],
            };
        }),
        setAccessors: mappedFields.map(field => {
            return {
                name: field.typeName,
                type: field.fieldTSType,
                hasExclamationToken: field.isRequired,
                hasQuestionToken: !field.isRequired,
                trailingTrivia: "\r\n",
                parameters: [{ name: field.name, type: field.fieldTSType }],
                statements: [`this.${field.name} = ${field.name};`],
            };
        }),
    });
}
exports.generateInputTypeClassFromType = generateInputTypeClassFromType;
//# sourceMappingURL=type-class.js.map