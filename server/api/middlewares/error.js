const httpStatus = require("http-status");
const { ValidationError } = require("express-validation");

const APIError = require("../../utils/APIError");
const { serverLogger } = require("../../config/logger");
const { env } = require("../../config/vars");

/**
 * Error handler. Send stacktrace only during development
 * @public
 */
const handler = (err, req, res, next) => {
  if (!err) res.json(httpStatus.OK);
  const response = {
    code: err.status,
    message: err.message || httpStatus[err.status],
    errors: err.errors,
    stack: err.stack
  };
  serverLogger.log({
    operationName: err.operationName || "",
    url: req.url || "",
    message: "api error",
    error: response,
    payload: err.payload,
    level: "error"
  });

  if (env === "master") {
    delete response.stack;
  }

  res.status(err.status);
  res.json(response);
};
exports.handler = handler;

/**
 * If error is not an instanceOf APIError, convert it.
 * @public
 */
exports.converter = (err, req, res, next) => {
  const { operationName, error, payload } = err;
  let convertedError;
  if (typeof error === "string") {
    convertedError = err;
  } else {
    convertedError = error;
  }
  if (!convertedError) return;
  if (convertedError instanceof ValidationError) {
    const firstErr = err.details[0];
    const firstErrMessage = Object.values(firstErr)[0];
    convertedError = new APIError({
      message: firstErrMessage || "Validation Error",
      errors: convertedError.details,
      status: convertedError.statusCode,
      stack: convertedError.stack
    });
  } else if (!(convertedError instanceof APIError)) {
    // TODO: This is a hack by @alacret
    if (convertedError !== undefined) {
      convertedError = new APIError({
        message: convertedError.message,
        status: convertedError.status,
        stack: convertedError.stack
      });
    }
  }
  convertedError.operationName = operationName || "";
  convertedError.payload = payload;
  return handler(convertedError, req, res);
};

/**
 * Catch 404 and forward to error handler
 * @public
 */
exports.notFound = (req, res, next) => {
  const err = new APIError({
    message: "Not found",
    url: req.url,
    status: httpStatus.NOT_FOUND
  });
  return handler(err, req, res);
};
