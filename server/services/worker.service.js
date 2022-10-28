const { AbortController } = require("node-abort-controller");

const workerService = () => {
  const runWithTimeLimit = async (fn, ms) => {
    const abortController = new AbortController();
    const abortSignal = abortController.signal;

    const timeout = setTimeout(() => {
      abortController.abort();
    }, ms);

    await fn(abortSignal);

    clearTimeout(timeout);
  };

  return {
    runWithTimeLimit
  };
};

module.exports = workerService;
