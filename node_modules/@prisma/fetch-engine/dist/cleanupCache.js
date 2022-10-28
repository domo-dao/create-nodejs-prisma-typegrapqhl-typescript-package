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
var cleanupCache_exports = {};
__export(cleanupCache_exports, {
  cleanupCache: () => cleanupCache
});
module.exports = __toCommonJS(cleanupCache_exports);
var import_debug = __toESM(require("@prisma/debug"));
var import_fs = __toESM(require("fs"));
var import_p_map = __toESM(require("p-map"));
var import_path = __toESM(require("path"));
var import_rimraf = __toESM(require("rimraf"));
var import_util = require("util");
var import_utils = require("./utils");
const debug = (0, import_debug.default)("cleanupCache");
const del = (0, import_util.promisify)(import_rimraf.default);
const readdir = (0, import_util.promisify)(import_fs.default.readdir);
const stat = (0, import_util.promisify)(import_fs.default.stat);
async function cleanupCache(n = 5) {
  try {
    const rootCacheDir = await (0, import_utils.getRootCacheDir)();
    if (!rootCacheDir) {
      debug("no rootCacheDir found");
      return;
    }
    const channel = "master";
    const cacheDir = import_path.default.join(rootCacheDir, channel);
    const dirs = await readdir(cacheDir);
    const dirsWithMeta = await Promise.all(
      dirs.map(async (dirName) => {
        const dir = import_path.default.join(cacheDir, dirName);
        const statResult = await stat(dir);
        return {
          dir,
          created: statResult.birthtime
        };
      })
    );
    dirsWithMeta.sort((a, b) => a.created < b.created ? 1 : -1);
    const dirsToRemove = dirsWithMeta.slice(n);
    await (0, import_p_map.default)(dirsToRemove, (dir) => del(dir.dir), { concurrency: 20 });
  } catch (e) {
  }
}
__name(cleanupCache, "cleanupCache");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  cleanupCache
});
