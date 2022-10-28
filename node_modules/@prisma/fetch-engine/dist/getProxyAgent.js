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
var getProxyAgent_exports = {};
__export(getProxyAgent_exports, {
  getProxyAgent: () => getProxyAgent
});
module.exports = __toCommonJS(getProxyAgent_exports);
var import_http_proxy_agent = __toESM(require("http-proxy-agent"));
var import_https_proxy_agent = __toESM(require("https-proxy-agent"));
var import_url = __toESM(require("url"));
function formatHostname(hostname) {
  return hostname.replace(/^\.*/, ".").toLowerCase();
}
__name(formatHostname, "formatHostname");
function parseNoProxyZone(zone) {
  zone = zone.trim().toLowerCase();
  const zoneParts = zone.split(":", 2);
  const zoneHost = formatHostname(zoneParts[0]);
  const zonePort = zoneParts[1];
  const hasPort = zone.includes(":");
  return { hostname: zoneHost, port: zonePort, hasPort };
}
__name(parseNoProxyZone, "parseNoProxyZone");
function uriInNoProxy(uri, noProxy) {
  const port = uri.port || (uri.protocol === "https:" ? "443" : "80");
  const hostname = formatHostname(uri.hostname);
  const noProxyList = noProxy.split(",");
  return noProxyList.map(parseNoProxyZone).some(function(noProxyZone) {
    const isMatchedAt = hostname.indexOf(noProxyZone.hostname);
    const hostnameMatched = isMatchedAt > -1 && isMatchedAt === hostname.length - noProxyZone.hostname.length;
    if (noProxyZone.hasPort) {
      return port === noProxyZone.port && hostnameMatched;
    }
    return hostnameMatched;
  });
}
__name(uriInNoProxy, "uriInNoProxy");
function getProxyFromURI(uri) {
  const noProxy = process.env.NO_PROXY || process.env.no_proxy || "";
  if (noProxy === "*") {
    return null;
  }
  if (noProxy !== "" && uriInNoProxy(uri, noProxy)) {
    return null;
  }
  if (uri.protocol === "http:") {
    return process.env.HTTP_PROXY || process.env.http_proxy || null;
  }
  if (uri.protocol === "https:") {
    return process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || null;
  }
  return null;
}
__name(getProxyFromURI, "getProxyFromURI");
function getProxyAgent(url) {
  const uri = import_url.default.parse(url);
  const proxy = getProxyFromURI(uri);
  if (!proxy) {
    return void 0;
  }
  if (uri.protocol === "http:") {
    return (0, import_http_proxy_agent.default)(proxy);
  }
  if (uri.protocol === "https:") {
    return (0, import_https_proxy_agent.default)(proxy);
  }
  return void 0;
}
__name(getProxyAgent, "getProxyAgent");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getProxyAgent
});
