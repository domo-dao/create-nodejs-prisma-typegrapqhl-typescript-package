"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var tracing_exports = {};
__export(tracing_exports, {
  createSpan: () => import_createSpan.createSpan,
  getTraceParent: () => import_getTraceParent.getTraceParent,
  getTracingConfig: () => import_getTracingConfig.getTracingConfig,
  runInChildSpan: () => import_runInChildSpan.runInChildSpan
});
module.exports = __toCommonJS(tracing_exports);
var import_createSpan = require("./createSpan");
var import_getTraceParent = require("./getTraceParent");
var import_getTracingConfig = require("./getTracingConfig");
var import_runInChildSpan = require("./runInChildSpan");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createSpan,
  getTraceParent,
  getTracingConfig,
  runInChildSpan
});
