"use strict";
var import_callOnce = require("./callOnce");
test("returns the result correctly", async () => {
  const wrapper = (0, import_callOnce.callOnce)(jest.fn().mockResolvedValue("hello"));
  await expect(wrapper()).resolves.toBe("hello");
});
test("forwards the arguments correctly", async () => {
  const wrapper = (0, import_callOnce.callOnce)((x) => Promise.resolve(x + 1));
  await expect(wrapper(2)).resolves.toBe(3);
});
test("\u0441alls wrapped function only once before promise resolves", async () => {
  const wrapped = jest.fn().mockResolvedValue("hello");
  const wrapper = (0, import_callOnce.callOnce)(wrapped);
  void wrapper();
  void wrapper();
  await wrapper();
  expect(wrapped).toBeCalledTimes(1);
});
test("caches the result", async () => {
  const wrapped = jest.fn().mockResolvedValue("hello");
  const wrapper = (0, import_callOnce.callOnce)(wrapped);
  await wrapper();
  await wrapper();
  const result = await wrapper();
  expect(wrapped).toBeCalledTimes(1);
  expect(result).toBe("hello");
});
