import { DMMF as PrismaDMMF } from "@prisma/client/runtime";
import { InternalGeneratorOptions, ExternalGeneratorOptions } from "./options";
export default function generateCode(dmmf: PrismaDMMF.Document, baseOptions: InternalGeneratorOptions & ExternalGeneratorOptions, log?: (msg: string) => void): Promise<void>;
