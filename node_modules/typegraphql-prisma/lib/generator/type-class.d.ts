import { Project } from "ts-morph";
import { DmmfDocument } from "./dmmf/dmmf-document";
import { DMMF } from "./dmmf/types";
import { GeneratorOptions } from "./options";
export declare function generateOutputTypeClassFromType(project: Project, dirPath: string, type: DMMF.OutputType, dmmfDocument: DmmfDocument): void;
export declare function generateInputTypeClassFromType(project: Project, dirPath: string, inputType: DMMF.InputType, _dmmfDocument: DmmfDocument, options: GeneratorOptions): void;
