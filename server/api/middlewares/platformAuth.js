const jwtAuth = require("./jwtAuth");
exports.authorize = (roles, isCompany) => jwtAuth.authorize(roles, isCompany);
