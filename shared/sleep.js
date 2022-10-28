const { sample } = require('lodash');

exports.msleep = (miliseconds) => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, miliseconds);
};
exports.sleep = (seconds) => {
  exports.msleep(seconds * 1000);
};

const MINUTES = [5, 10, 15];

exports.sleepRandomMinutes = () => {
  return exports.sleep(sample(MINUTES) * 60);
};
