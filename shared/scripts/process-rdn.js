const { processRdnCasesService } = require('../../modules/rdn/services');
const companyService = require('../../server/services/company.service');

require('dotenv').config();
global.__baseDir = __dirname;

const script = async () => {
  const companies = await companyService().getAllApprovedCompanies();

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(company.dbName);
    if (company.dbName !== 'rra_db') continue;
    await processRdnCasesService(company);
  }

  return;
};

script()
  .catch(console.error)
  .finally(() => {
    console.log('Test Finished');
    process.exit();
  });
