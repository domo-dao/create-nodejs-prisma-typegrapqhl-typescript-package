"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var isCi_exports = {};
__export(isCi_exports, {
  isCi: () => isCi
});
module.exports = __toCommonJS(isCi_exports);
const isCi = /* @__PURE__ */ __name(() => {
  const env = process.env;
  return !!(env.CI || env.CONTINUOUS_INTEGRATION || env.BUILD_NUMBER || env.RUN_ID || env.APPVEYOR || env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI || env.AC_APPCIRCLE || env.bamboo_planKey || env.BITBUCKET_COMMIT || env.BITRISE_IO || env.BUILDKITE || env.CIRCLECI || env.CIRRUS_CI || env.CODEBUILD_BUILD_ARN || env.CF_BUILD_ID || env.CI_NAME || env.DRONE || env.DSARI || env.EAS_BUILD || env.GITHUB_ACTIONS || env.GITLAB_CI || env.GOCD || env.LAYERCI || env.HUDSON || env.JENKINS || env.MAGNUM || env.NETLIFY || env.NEVERCODE || env.RENDER || env.SAILCI || env.SEMAPHORE || env.SCREWDRIVER || env.SHIPPABLE || env.TDDIUM || env.STRIDER || env.TEAMCITY_VERSION || env.TRAVIS || env.NOW_BUILDER || env.APPCENTER_BUILD_ID || false);
}, "isCi");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isCi
});
