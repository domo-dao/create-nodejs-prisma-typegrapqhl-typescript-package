/**
 * Short version of try and catch
 * @param promise
 * @param finallyFunction
 * @returns {*}
 */
exports.tryAndCatch = (promise, finallyFunction = null, throwIfError = false) => {
  return promise
    .then((result) => {
      return [result, null];
    })
    .catch((error) => {
      if (throwIfError === true) {
        throw error;
      }
      return [null, error];
    })
    .finally(() => {
      if (finallyFunction !== null) {
        if (typeof finallyFunction === 'function') {
          finallyFunction();
        }
      }
    });
};
