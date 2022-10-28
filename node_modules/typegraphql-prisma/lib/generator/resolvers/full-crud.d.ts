import { Project } from "ts-morph";
import { DmmfDocument } from "../dmmf/dmmf-document";
import { DMMF } from "../dmmf/types";
export default function generateCrudResolverClassFromMapping(project: Project, baseDirPath: string, mapping: DMMF.ModelMapping, model: DMMF.Model, dmmfDocument: DmmfDocument): void;
