"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseStringArray = exports.parseStringBoolean = void 0;
function parseStringBoolean(stringBoolean) {
    return stringBoolean ? stringBoolean === "true" : undefined;
}
exports.parseStringBoolean = parseStringBoolean;
function parseStringArray(stringArray, optionPropertyName, allowedValues) {
    if (!stringArray) {
        return undefined;
    }
    const parsedArray = stringArray.split(",").map(it => it.trim());
    if (allowedValues) {
        for (const option of parsedArray) {
            if (!allowedValues.includes(option)) {
                throw new Error(`Invalid "${optionPropertyName}" option value "${option}" provided for TypeGraphQL generator.`);
            }
        }
    }
    return parsedArray;
}
exports.parseStringArray = parseStringArray;
//# sourceMappingURL=helpers.js.map