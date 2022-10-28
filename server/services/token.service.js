const jwt = require("jsonwebtoken");
const crypto = require("crypto");


const tokenService = () => {
  const issueJWT = (payload, isExpired) => {
    if (isExpired) {
      return jwt.sign(payload, null, {
        expiresIn: 0
      });
    } else {
      return jwt.sign(payload, null);
    }
  };

  const verifyJWT = (token, jwtSecretkey, cb) => {
    return jwt.verify(token, jwtSecretkey || null, {}, cb);
  };

  const decodeJWT = token => {
    return jwt.decode(token);
  };

  const issueCrypto = id => `${id}.${crypto.randomBytes(40).toString("hex")}`;

  return {
    issueJWT,
    verifyJWT,
    issueCrypto,
    decodeJWT
  };
};

module.exports = tokenService;
