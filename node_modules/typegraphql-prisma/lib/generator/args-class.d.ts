import { Project } from "ts-morph";
import { DmmfDocument } from "./dmmf/dmmf-document";
import { DMMF } from "./dmmf/types";
export default function generateArgsTypeClassFromArgs(project: Project, generateDirPath: string, fields: DMMF.SchemaArg[], argsTypeName: string, dmmfDocument: DmmfDocument, inputImportsLevel?: number): void;
