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
var ExitHooks_exports = {};
__export(ExitHooks_exports, {
  ExitHooks: () => ExitHooks
});
module.exports = __toCommonJS(ExitHooks_exports);
var import_debug = __toESM(require("@prisma/debug"));
const debug = (0, import_debug.default)("prisma:client:libraryEngine:exitHooks");
class ExitHooks {
  constructor() {
    this.nextOwnerId = 1;
    this.ownerToIdMap = /* @__PURE__ */ new WeakMap();
    this.idToListenerMap = /* @__PURE__ */ new Map();
    this.areHooksInstalled = false;
  }
  install() {
    if (this.areHooksInstalled) {
      return;
    }
    this.installHook("beforeExit");
    this.installHook("exit");
    this.installHook("SIGINT", true);
    this.installHook("SIGUSR2", true);
    this.installHook("SIGTERM", true);
    this.areHooksInstalled = true;
  }
  setListener(owner, listener) {
    if (listener) {
      let id = this.ownerToIdMap.get(owner);
      if (!id) {
        id = this.nextOwnerId++;
        this.ownerToIdMap.set(owner, id);
      }
      this.idToListenerMap.set(id, listener);
    } else {
      const id = this.ownerToIdMap.get(owner);
      if (id !== void 0) {
        this.ownerToIdMap.delete(owner);
        this.idToListenerMap.delete(id);
      }
    }
  }
  getListener(owner) {
    const id = this.ownerToIdMap.get(owner);
    if (id === void 0) {
      return void 0;
    }
    return this.idToListenerMap.get(id);
  }
  installHook(event, shouldExit = false) {
    process.once(event, async (code) => {
      debug(`exit event received: ${event}`);
      for (const listener of this.idToListenerMap.values()) {
        await listener();
      }
      this.idToListenerMap.clear();
      if (shouldExit && process.listenerCount(event) === 0) {
        process.exit(code);
      }
    });
  }
}
__name(ExitHooks, "ExitHooks");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ExitHooks
});
