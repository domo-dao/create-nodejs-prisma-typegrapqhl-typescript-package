import { BinaryType } from '@prisma/fetch-engine';
import * as TE from 'fp-ts/TaskEither';
export declare function getEngineVersion(enginePath?: string, binaryName?: BinaryType): Promise<string>;
export declare function safeGetEngineVersion(enginePath?: string, binaryName?: BinaryType): TE.TaskEither<Error, string>;
