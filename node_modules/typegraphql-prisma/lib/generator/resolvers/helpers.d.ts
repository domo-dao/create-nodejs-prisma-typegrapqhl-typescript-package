import { OptionalKind, MethodDeclarationStructure } from "ts-morph";
import { DmmfDocument } from "../dmmf/dmmf-document";
import { DMMF } from "../dmmf/types";
export declare function generateCrudResolverClassMethodDeclaration(action: DMMF.Action, mapping: DMMF.ModelMapping, dmmfDocument: DmmfDocument): OptionalKind<MethodDeclarationStructure>;
