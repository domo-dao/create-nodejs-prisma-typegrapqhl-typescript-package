const tokenService = require("../../services/token.service");
const { gatewayJwtSecret } = require("../../config/vars");
const {
  DEFAULT_SERVER_TIMEZONE_VALUE
} = require("../../constants/app.constants");
const systemService = require("../../services/system.service");

exports.authorizeGateway = async (req, res, next) => {
  try {
    if (req.headers.gatewaytoken) {
      const jwtgatewaytoken = req.headers.gatewaytoken;
      const decodedToken = tokenService().verifyJWT(
        jwtgatewaytoken,
        gatewayJwtSecret
      );
      if (decodedToken.dbName) {
        req.dbName = decodedToken.dbName;
      }
      delete req.headers.gatewaytoken;
    } else {
      req.dbName = "rra_db";
    }
    // TODO: We need to remove this
    if (req.dbName) {
      const serverTime = await systemService().getServerTime(req.dbName);
      if (serverTime && serverTime.timezoneOffset) {
        req.timezoneOffset =
          serverTime.timezoneOffset || DEFAULT_SERVER_TIMEZONE_VALUE;
      } else {
        req.timezoneOffset = DEFAULT_SERVER_TIMEZONE_VALUE;
      }
    }
  } catch (e) {
    console.error(e);
    return next({ operationName: "authorizeGateway", error: e });
  }
  return next();
};
