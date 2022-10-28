export declare const modelAttributeRegex: RegExp;
export declare const fieldAttributeRegex: RegExp;
export declare const attributeNameRegex: RegExp;
export declare const attributeArgsRegex: RegExp;
export declare function parseDocumentationAttributes<TData extends object = object>(documentation: string | undefined, expectedAttributeName: string, expectedAttributeKind: "model" | "field"): Partial<TData>;
