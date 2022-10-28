export declare function parseStringBoolean(stringBoolean: string | undefined): boolean | undefined;
export declare function parseStringArray<TAllowedValue extends string>(stringArray: string | undefined, optionPropertyName: string, allowedValues?: TAllowedValue[]): TAllowedValue[] | undefined;
