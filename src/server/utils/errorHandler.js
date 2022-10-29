const httpStatus = require('http-status');
const { serverLogger } = require('../config/logger');

async function handler(err) {
  const response = {
    code: err.status,
    message: err.message || httpStatus[err.status],
    errors: err.errors,
    stack: err.stack,
  };

  serverLogger.log({
    message: 'api error =>',
    error: response,
    level: 'error',
  });
}

module.exports = {
  handler,
};
