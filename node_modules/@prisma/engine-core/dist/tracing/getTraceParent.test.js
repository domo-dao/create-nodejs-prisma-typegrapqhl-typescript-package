"use strict";
var import_getTraceParent = require("./getTraceParent");
it("should return 00 traceparent when tracing is disabled", () => {
  const tracingConfig = {
    enabled: false,
    middleware: false
  };
  const result = (0, import_getTraceParent.getTraceParent)({
    tracingConfig
  });
  const [ending] = result.split("-").reverse();
  expect(ending).toEqual("00");
});
