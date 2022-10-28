"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const ts_morph_1 = require("ts-morph");
const path_1 = tslib_1.__importDefault(require("path"));
const imports_1 = require("./imports");
const config_1 = require("./config");
const helpers_1 = require("./helpers");
function generateObjectTypeClassFromModel(project, baseDirPath, model, modelOutputType, dmmfDocument) {
    const dirPath = path_1.default.resolve(baseDirPath, config_1.modelsFolderName);
    const filePath = path_1.default.resolve(dirPath, `${model.typeName}.ts`);
    const sourceFile = project.createSourceFile(filePath, undefined, {
        overwrite: true,
    });
    (0, imports_1.generateTypeGraphQLImport)(sourceFile);
    (0, imports_1.generateGraphQLScalarsImport)(sourceFile);
    (0, imports_1.generatePrismaNamespaceImport)(sourceFile, dmmfDocument.options, 1);
    (0, imports_1.generateCustomScalarsImport)(sourceFile, 1);
    (0, imports_1.generateModelsImports)(sourceFile, model.fields
        .filter(field => field.location === "outputObjectTypes")
        .filter(field => field.type !== model.name)
        .map(field => dmmfDocument.isModelName(field.type)
        ? dmmfDocument.getModelTypeName(field.type)
        : field.type));
    (0, imports_1.generateEnumsImports)(sourceFile, model.fields
        .filter(field => field.location === "enumTypes")
        .map(field => field.type));
    const countField = modelOutputType.fields.find(it => it.name === "_count");
    const shouldEmitCountField = countField !== undefined &&
        dmmfDocument.shouldGenerateBlock("crudResolvers");
    if (shouldEmitCountField) {
        (0, imports_1.generateResolversOutputsImports)(sourceFile, [countField.typeGraphQLType]);
    }
    sourceFile.addClass({
        name: model.typeName,
        isExported: true,
        decorators: [
            {
                name: "TypeGraphQL.ObjectType",
                arguments: [
                    `"${model.typeName}"`,
                    ts_morph_1.Writers.object({
                        isAbstract: "true",
                        ...(model.docs && { description: `"${model.docs}"` }),
                        ...(dmmfDocument.options.simpleResolvers && {
                            simpleResolvers: "true",
                        }),
                    }),
                ],
            },
        ],
        properties: [
            ...model.fields.map(field => {
                const isOptional = !!field.relationName ||
                    field.isOmitted.output ||
                    (!field.isRequired && field.typeFieldAlias === undefined);
                return {
                    name: field.name,
                    type: field.fieldTSType,
                    hasExclamationToken: !isOptional,
                    hasQuestionToken: isOptional,
                    trailingTrivia: "\r\n",
                    decorators: [
                        ...(field.relationName ||
                            field.typeFieldAlias ||
                            field.isOmitted.output
                            ? []
                            : [
                                {
                                    name: "TypeGraphQL.Field",
                                    arguments: [
                                        `_type => ${field.typeGraphQLType}`,
                                        ts_morph_1.Writers.object({
                                            nullable: `${isOptional}`,
                                            ...(field.docs && { description: `"${field.docs}"` }),
                                        }),
                                    ],
                                },
                            ]),
                    ],
                    ...(field.docs && {
                        docs: [{ description: `\n${(0, helpers_1.convertNewLines)(field.docs)}` }],
                    }),
                };
            }),
            ...(shouldEmitCountField
                ? [
                    {
                        name: countField.name,
                        type: countField.fieldTSType,
                        hasExclamationToken: countField.isRequired,
                        hasQuestionToken: !countField.isRequired,
                        trailingTrivia: "\r\n",
                        decorators: [
                            {
                                name: "TypeGraphQL.Field",
                                arguments: [
                                    `_type => ${countField.typeGraphQLType}`,
                                    ts_morph_1.Writers.object({
                                        nullable: `${!countField.isRequired}`,
                                    }),
                                ],
                            },
                        ],
                    },
                ]
                : []),
        ],
        getAccessors: model.fields
            .filter(field => field.typeFieldAlias &&
            !field.relationName &&
            !field.isOmitted.output)
            .map(field => {
            return {
                name: field.typeFieldAlias,
                returnType: field.fieldTSType,
                trailingTrivia: "\r\n",
                decorators: [
                    {
                        name: "TypeGraphQL.Field",
                        arguments: [
                            `_type => ${field.typeGraphQLType}`,
                            ts_morph_1.Writers.object({
                                nullable: `${!field.isRequired}`,
                                ...(field.docs && { description: `"${field.docs}"` }),
                            }),
                        ],
                    },
                ],
                statements: [
                    field.isRequired
                        ? `return this.${field.name};`
                        : `return this.${field.name} ?? null;`,
                ],
                ...(field.docs && {
                    docs: [{ description: `\n${(0, helpers_1.convertNewLines)(field.docs)}` }],
                }),
            };
        }),
        ...(model.docs && {
            docs: [{ description: `\n${(0, helpers_1.convertNewLines)(model.docs)}` }],
        }),
    });
}
exports.default = generateObjectTypeClassFromModel;
//# sourceMappingURL=model-type-class.js.map