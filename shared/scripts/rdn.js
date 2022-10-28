const {
  fetchRDNCasesService,
  processRdnCasesService,
  fetchRDNEventsService,
} = require('../../modules/rdn/services');
const companyService = require('../../server/services/company.service');

require('dotenv').config();
global.__baseDir = __dirname;

const fetchRDNCasesServiceTest = async () => {
  // const companies = await companyService().getAllApprovedCompanies();
  //
  // async function fetchRDNCasesPerCompany(company) {
  //   for (let i = 0; i < 100; i++) {
  //     await fetchRDNCasesService(company);
  //   }
  // }
  // await Promise.all(companies.map(fetchRDNCasesPerCompany));

  const companies = await companyService().getAllApprovedCompanies();

  async function processRdnCasesServicePerCompany(company) {
    for (let i = 0; i < 1; i++) {
      try {
        await processRdnCasesService(company);
      } catch (e) {}
    }
  }

  // await Promise.all(companies.map(processRdnCasesServicePerCompany));
  console.log(companies[0].name);
  await processRdnCasesServicePerCompany(companies[0]);

  // for (let i = 0; i < 1; i++) {
  //   const companies = await companyService().getAllApprovedCompanies();
  //   for (let j = 0; j < companies.length; j++) {
  //     const company = companies[j];
  //     await fetchRDNEventsService(company);
  //     break;
  //   }
  //   break;
  // }

  return;
};

fetchRDNCasesServiceTest()
  .catch(console.error)
  .finally(() => {
    console.log('Test Finished');
    process.exit();
  });
