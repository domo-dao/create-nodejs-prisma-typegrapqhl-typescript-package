"use strict";
var import_getTracingConfig = require("./getTracingConfig");
it("should return enabled=false when tracing preview is not set", () => {
  const response = (0, import_getTracingConfig.getTracingConfig)([]);
  expect(response).toMatchObject({
    enabled: false
  });
});
it("should return enabled=false global var is not set", () => {
  const response = (0, import_getTracingConfig.getTracingConfig)([]);
  expect(response).toMatchObject({
    enabled: false
  });
});
it("should return enabled=true when both are set", () => {
  global.PRISMA_INSTRUMENTATION = true;
  const response = (0, import_getTracingConfig.getTracingConfig)(["tracing"]);
  expect(response).toMatchObject({
    enabled: true
  });
});
