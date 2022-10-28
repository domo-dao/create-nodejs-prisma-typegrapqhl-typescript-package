"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var isNodeAPISupported_exports = {};
__export(isNodeAPISupported_exports, {
  isNodeAPISupported: () => isNodeAPISupported
});
module.exports = __toCommonJS(isNodeAPISupported_exports);
var import_fs = __toESM(require("fs"));
var import__ = require(".");
async function isNodeAPISupported() {
  const customLibraryPath = process.env.PRISMA_QUERY_ENGINE_LIBRARY;
  const customLibraryExists = customLibraryPath && import_fs.default.existsSync(customLibraryPath);
  const os = await (0, import__.getos)();
  if (!customLibraryExists && (os.arch === "x32" || os.arch === "ia32")) {
    throw new Error(
      `The default query engine type (Node-API, "library") is currently not supported for 32bit Node. Please set \`engineType = "binary"\` in the "generator" block of your "schema.prisma" file (or use the environment variables "PRISMA_CLIENT_ENGINE_TYPE=binary" and/or "PRISMA_CLI_QUERY_ENGINE_TYPE=binary".)`
    );
  }
}
__name(isNodeAPISupported, "isNodeAPISupported");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isNodeAPISupported
});
