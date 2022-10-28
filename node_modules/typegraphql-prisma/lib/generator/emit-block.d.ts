export declare type EmitBlockKind = "enums" | "models" | "crudResolvers" | "relationResolvers" | "inputs" | "outputs";
export declare const ALL_EMIT_BLOCK_KINDS: EmitBlockKind[];
export declare const BLOCKS_DEPENDENCIES_MAP: Record<EmitBlockKind, EmitBlockKind[]>;
export declare function getBlocksToEmit(emitOnly: EmitBlockKind[] | undefined): EmitBlockKind[];
