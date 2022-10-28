"use strict";
var import_isInteractive = require("../isInteractive");
const originalEnv = { ...process.env };
describe("isInteractive", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  afterAll(() => {
    process.env = { ...originalEnv };
  });
  describe("in non TTY environment", () => {
    const mockedValue = { isTTY: false };
    test("isInteractive should be false", () => {
      expect((0, import_isInteractive.isInteractive)({ stream: mockedValue })).toBe(false);
    });
    test("isInteractive should be false if TERM = dumb", () => {
      process.env.TERM = "dumb";
      expect((0, import_isInteractive.isInteractive)({ stream: mockedValue })).toBe(false);
    });
  });
  describe("in TTY environment", () => {
    const mockedValue = { isTTY: true };
    test("isInteractive should be true", () => {
      expect((0, import_isInteractive.isInteractive)({ stream: mockedValue })).toBe(true);
    });
    test("isInteractive should be false if TERM = dumb", () => {
      process.env.TERM = "dumb";
      expect((0, import_isInteractive.isInteractive)({ stream: mockedValue })).toBe(false);
    });
  });
});
