"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUnixPath = exports.convertNewLines = exports.cleanDocsString = exports.getInputTypeName = exports.getModelNameFromInputType = exports.pascalCase = exports.camelCase = exports.mapScalarToTypeGraphQLType = exports.getTypeGraphQLType = exports.mapScalarToTSType = exports.getFieldTSType = exports.noop = void 0;
const helpers_1 = require("./dmmf/helpers");
var PrismaScalars;
(function (PrismaScalars) {
    PrismaScalars["String"] = "String";
    PrismaScalars["Boolean"] = "Boolean";
    PrismaScalars["Int"] = "Int";
    PrismaScalars["Float"] = "Float";
    PrismaScalars["DateTime"] = "DateTime";
    PrismaScalars["Json"] = "Json";
    PrismaScalars["BigInt"] = "BigInt";
    PrismaScalars["Decimal"] = "Decimal";
    PrismaScalars["Bytes"] = "Bytes";
})(PrismaScalars || (PrismaScalars = {}));
function noop() { }
exports.noop = noop;
function getFieldTSType(dmmfDocument, typeInfo, isRequired, isInputType, modelName, typeName) {
    let TSType = typeInfo.type;
    if (typeInfo.location === "scalar") {
        TSType = mapScalarToTSType(typeInfo.type, isInputType);
    }
    else if (typeInfo.location === "inputObjectTypes" ||
        typeInfo.location === "outputObjectTypes") {
        if (!dmmfDocument.isModelName(typeInfo.type) && (!typeName || !modelName)) {
            TSType = getInputTypeName(typeInfo.type, dmmfDocument);
        }
    }
    else if (typeInfo.location === "enumTypes") {
        const enumDef = dmmfDocument.enums.find(it => it.typeName == typeInfo.type);
        TSType = enumDef.valuesMap.map(({ value }) => `"${value}"`).join(" | ");
    }
    else {
        throw new Error(`Unsupported field type location: ${typeInfo.location}`);
    }
    if (typeInfo.isList) {
        if (TSType.includes(" ")) {
            TSType = `Array<${TSType}>`;
        }
        else {
            TSType += "[]";
        }
    }
    if (!isRequired) {
        if (isInputType) {
            TSType += " | undefined";
        }
        else {
            TSType += " | null";
        }
    }
    return TSType;
}
exports.getFieldTSType = getFieldTSType;
function mapScalarToTSType(scalar, isInputType) {
    switch (scalar) {
        case PrismaScalars.String: {
            return "string";
        }
        case PrismaScalars.Boolean: {
            return "boolean";
        }
        case PrismaScalars.Int:
        case PrismaScalars.Float: {
            return "number";
        }
        case PrismaScalars.DateTime: {
            return "Date";
        }
        case PrismaScalars.Json:
            return isInputType ? "Prisma.InputJsonValue" : "Prisma.JsonValue";
        case PrismaScalars.BigInt: {
            return "bigint";
        }
        case PrismaScalars.Decimal: {
            return "Prisma.Decimal";
        }
        case PrismaScalars.Bytes: {
            return "Buffer";
        }
        default:
            throw new Error(`Unrecognized scalar type: ${scalar}`);
    }
}
exports.mapScalarToTSType = mapScalarToTSType;
function getTypeGraphQLType(typeInfo, dmmfDocument, modelName, typeName, isIdField) {
    let GraphQLType = typeInfo.type;
    if (typeInfo.location === "scalar") {
        GraphQLType = mapScalarToTypeGraphQLType(typeInfo.type, dmmfDocument.options.emitIdAsIDType, isIdField);
    }
    else if ((typeInfo.location === "inputObjectTypes" ||
        typeInfo.location === "outputObjectTypes") &&
        (!typeName || !modelName) &&
        !dmmfDocument.isModelName(typeInfo.type)) {
        GraphQLType = getInputTypeName(typeInfo.type, dmmfDocument);
    }
    if (typeInfo.isList) {
        GraphQLType = `[${GraphQLType}]`;
    }
    return GraphQLType;
}
exports.getTypeGraphQLType = getTypeGraphQLType;
function mapScalarToTypeGraphQLType(scalar, emitIdAsIDType, isIdField) {
    if (emitIdAsIDType && isIdField) {
        return `TypeGraphQL.ID`;
    }
    switch (scalar) {
        case PrismaScalars.String:
        case PrismaScalars.Boolean: {
            return scalar;
        }
        case PrismaScalars.Int:
        case PrismaScalars.Float: {
            return `TypeGraphQL.${scalar}`;
        }
        case PrismaScalars.DateTime: {
            return "Date";
        }
        case PrismaScalars.Json: {
            return `GraphQLScalars.JSONResolver`;
        }
        case PrismaScalars.BigInt: {
            return "GraphQLScalars.BigIntResolver";
        }
        case PrismaScalars.Decimal: {
            return "DecimalJSScalar";
        }
        case PrismaScalars.Bytes: {
            return "GraphQLScalars.ByteResolver";
        }
        default: {
            throw new Error(`Unrecognized scalar type: ${scalar}`);
        }
    }
}
exports.mapScalarToTypeGraphQLType = mapScalarToTypeGraphQLType;
function camelCase(str) {
    return str[0].toLowerCase() + str.slice(1);
}
exports.camelCase = camelCase;
function pascalCase(str) {
    return str[0].toUpperCase() + str.slice(1);
}
exports.pascalCase = pascalCase;
function getInputKeywordPhrasePosition(inputTypeName) {
    const inputParseResult = [
        "Unchecked",
        "Create",
        "CountOrderBy",
        "AvgOrderBy",
        "MaxOrderBy",
        "MinOrderBy",
        "SumOrderBy",
        "OrderBy",
        "Update",
        "Upsert",
        "ScalarWhere",
        "Where",
        "ListRelationFilter",
        "RelationFilter",
        "Filter",
    ]
        .map(inputKeyword => inputTypeName.search(inputKeyword))
        .filter(position => position >= 0);
    if (inputParseResult.length === 0) {
        return;
    }
    const keywordPhrasePosition = inputParseResult[0];
    return keywordPhrasePosition;
}
function getModelNameFromInputType(inputTypeName) {
    const keywordPhrasePosition = getInputKeywordPhrasePosition(inputTypeName);
    if (!keywordPhrasePosition) {
        return;
    }
    const modelName = inputTypeName.slice(0, keywordPhrasePosition);
    return modelName;
}
exports.getModelNameFromInputType = getModelNameFromInputType;
function getInputTypeName(originalInputName, dmmfDocument) {
    const keywordPhrasePosition = getInputKeywordPhrasePosition(originalInputName);
    if (!keywordPhrasePosition) {
        return originalInputName;
    }
    const modelName = originalInputName.slice(0, keywordPhrasePosition);
    const typeNameRest = originalInputName.slice(keywordPhrasePosition);
    const modelTypeName = dmmfDocument.getModelTypeName(modelName);
    if (!modelTypeName) {
        return originalInputName;
    }
    return `${modelTypeName}${typeNameRest}`;
}
exports.getInputTypeName = getInputTypeName;
function cleanDocsString(documentation) {
    if (!documentation) {
        return;
    }
    let cleanedDocs = documentation;
    cleanedDocs = cleanedDocs.replace(helpers_1.modelAttributeRegex, "");
    cleanedDocs = cleanedDocs.replace(helpers_1.fieldAttributeRegex, "");
    cleanedDocs = cleanedDocs.split('"').join('\\"');
    cleanedDocs = cleanedDocs.split("\n").join("\\n");
    if (cleanedDocs.endsWith("\r")) {
        cleanedDocs = cleanedDocs.slice(0, -1);
    }
    if (cleanedDocs.endsWith("\\r")) {
        cleanedDocs = cleanedDocs.slice(0, -2);
    }
    if (cleanedDocs.endsWith("\n")) {
        cleanedDocs = cleanedDocs.slice(0, -1);
    }
    if (cleanedDocs.endsWith("\\n")) {
        cleanedDocs = cleanedDocs.slice(0, -2);
    }
    return cleanedDocs;
}
exports.cleanDocsString = cleanDocsString;
function convertNewLines(str) {
    return str.split("\\n").join("\n");
}
exports.convertNewLines = convertNewLines;
function toUnixPath(maybeWindowsPath) {
    return maybeWindowsPath.split("\\").join("/");
}
exports.toUnixPath = toUnixPath;
//# sourceMappingURL=helpers.js.map