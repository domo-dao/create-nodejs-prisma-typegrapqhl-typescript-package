const APIError = require("../../server/utils/APIError");
const tokenService = require("../../server/services/token.service");
const { getSubscriptionStatus } = require("../services/subscription.service");

const subscriptionCheck = async req => {
  const token = req.headers.authorization;
  if (!token) throw new APIError({ message: "No Token" });

  const payload = tokenService().decodeJWT(token);
  if (!payload) {
    throw new APIError({ message: "Error decoding JWT token" });
  }
  const status = await getSubscriptionStatus(payload.dbName);
  if (status !== true) {
    throw new APIError({ message: "Inactive subscription" });
  }
};

module.exports = subscriptionCheck;
