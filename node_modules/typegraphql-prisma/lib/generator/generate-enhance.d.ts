import { SourceFile } from "ts-morph";
import { DmmfDocument } from "./dmmf/dmmf-document";
import { DMMF } from "./dmmf/types";
export declare function generateEnhanceMap(sourceFile: SourceFile, dmmfDocument: DmmfDocument, modelMappings: DMMF.ModelMapping[], relationModels: DMMF.RelationModel[], models: DMMF.Model[], inputs: DMMF.InputType[], outputs: DMMF.OutputType[]): void;
