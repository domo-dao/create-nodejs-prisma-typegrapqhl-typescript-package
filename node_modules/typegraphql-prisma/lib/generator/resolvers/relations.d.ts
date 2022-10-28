import { Project } from "ts-morph";
import { DmmfDocument } from "../dmmf/dmmf-document";
import { DMMF } from "../dmmf/types";
export default function generateRelationsResolverClassesFromModel(project: Project, baseDirPath: string, dmmfDocument: DmmfDocument, { model, relationFields, resolverName }: DMMF.RelationModel): void;
