const tokenService = require("../../server/services/token.service");
const {
  DEFAULT_SERVER_TIMEZONE_VALUE
} = require("../../server/constants/app.constants");
const systemService = require("../../server/services/system.service");
const { gatewayJwtSecret, jwtSecret } = require("../../server/config/vars");

const token = (req, res, next) => {
  if (
    req.headers.authorization === "" ||
    req.headers.authorization === null ||
    req.headers.authorization === undefined
  ) {
    return next();
  }

  // eslint-disable-next-line no-unused-vars
  const [_, token] = String(req.headers.authorization).split(" ");
  let decodedToken;
  try {
    decodedToken = tokenService().verifyJWT(token, jwtSecret);
  } catch (e) {
    console.error("DEBUG:token.js:token:verifyJWT:error:jwtSecret", e);
    try {
      decodedToken = tokenService().verifyJWT(token, gatewayJwtSecret);
    } catch (e) {
      console.error(
        "DEBUG:token.js:token:verifyJWT:error:gatewayJwtSecret:",
        e
      );
      return next();
    }
  }

  if (!decodedToken.dbName) {
    return next();
  }

  req.dbName = decodedToken.dbName;
  systemService()
    .getServerTime(req.dbName)
    .then(serverTime => {
      if (serverTime && serverTime.timezoneOffset) {
        req.timezoneOffset =
          serverTime.timezoneOffset || DEFAULT_SERVER_TIMEZONE_VALUE;
      } else {
        req.timezoneOffset = DEFAULT_SERVER_TIMEZONE_VALUE;
      }
      next();
    })
    .catch(e => {
      console.error("DEBUG:token.js:token:getServerTime:error", e);
      next();
    });
};
module.exports = { token };
