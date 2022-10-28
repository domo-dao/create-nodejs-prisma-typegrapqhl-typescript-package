const { fetchPlatformCompanyAndUser } = require('../../modules/platform/services');
const httpStatus = require('http-status');

const companyEnhancer = (req, res, next) => {
  const email = req.body.email;

  if (!email) {
    return next({ error: new Error('Company Middleware: email not found') });
  }

  fetchPlatformCompanyAndUser(req.body.email)
    .then(({ platformUser, company }) => {
      req.platformUser = platformUser;
      req.company = company;
      req.dbName = company.dbName;
      return next();
    })
    .catch((error) => {
      return res.status(httpStatus.NOT_FOUND).send({
        code: error.code,
        message: error.message,
      });
    });
};

module.exports = { companyEnhancer };
