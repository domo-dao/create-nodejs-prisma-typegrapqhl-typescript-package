const companyService = require('../../server/services/company.service');
const { addCameraScansAndHits } = require('../../server/drn/crons');

require('dotenv').config();
global.__baseDir = __dirname;

const main = async () => {
  const companies = await companyService().getAllApprovedCompanies();
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    await addCameraScansAndHits(company);
    return;
  }
  return;
};

main()
  .catch(console.error)
  .finally(() => {
    console.log('RDN SCRIPT Finished');
    process.exit();
  });
