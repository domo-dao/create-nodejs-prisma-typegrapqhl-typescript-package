import { Project } from "ts-morph";
import { DMMF } from "./dmmf/types";
import { DmmfDocument } from "./dmmf/dmmf-document";
export default function generateObjectTypeClassFromModel(project: Project, baseDirPath: string, model: DMMF.Model, modelOutputType: DMMF.OutputType, dmmfDocument: DmmfDocument): void;
