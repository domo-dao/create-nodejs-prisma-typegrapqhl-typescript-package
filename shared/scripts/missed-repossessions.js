const Sequelize = require('sequelize');
const companyService = require('../../server/services/company.service');

require('dotenv').config();
global.__baseDir = __dirname;

const process = async () => {
  const companies = await companyService().getAllApprovedCompanies();
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    console.log(`Processing company ${company.name}`);
    const { Case, MissedRepossession } = await companyService().getCompanyDatabase(company.dbName);

    const missedCases = await MissedRepossession.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            vin: { [Sequelize.Op.eq]: null },
          },
          {
            vin: { [Sequelize.Op.eq]: '' },
          },
        ],
      },
    });
    console.log(`Found ${missedCases.length} missed cases`);

    for (let j = 0; j < missedCases.length; j++) {
      const missedCase = missedCases[j];
      console.log(`Processing case ${missedCase.caseId}: ${missedCase.vin} `);
      const originalCase = await Case.findOne({
        where: { caseId: missedCase.caseId },
      });
      console.log(`originalCase case ${originalCase.caseId}: ${originalCase.vin} `);
      missedCase.vin = originalCase.vin;
      await missedCase.save();
      console.log(`End Processing case ${missedCase.caseId}: ${missedCase.vin} `);
      return;
    }
    return;
  }
};

process()
  .then(console.log)
  .catch(console.error)
  .finally(() => {
    console.log('Script Finished');
    console.dir(process);
  });
