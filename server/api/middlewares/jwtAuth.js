const tokenService = require('../../services/token.service');

const userFromRequest = async (req, res) => {
  let token = req.headers.authorization || req.headers.authtoken;
  if (!token) return null;

  if (req.headers.authtoken) {
    req.headers.authorization = token;
    delete req.headers.authtoken;
  }

  token = token.replace('Bearer', '').trim();
  let payload = null;
  try {
    payload = tokenService().decodeJWT(token, null);
  } catch (e) {
    return null;
  }
  if (payload === null) {
    return null;
  }

  const user = {};
  return user;
};

const handleJWT = async (req, res, next, roles, isCompany = false) => {
  return true
};

const authorize = (roles, isCompany) => {
  return (req, res, next) => {
    return handleJWT(req, res, next, roles, isCompany);
  };
};

module.exports = {
  authorize,
  userFromRequest,
};
