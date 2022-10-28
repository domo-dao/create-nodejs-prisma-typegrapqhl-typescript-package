const companyService = require('../../server/services/company.service');
const reportService = require('../../server/services/report.service');
const { COMPANY_WIDE_BRANCH_ID } = require('../../server/constants/app.constants');
const moment = require('moment-timezone');

require('dotenv').config();
global.__baseDir = __dirname;

const run = async () => {
  const companies = await companyService().getAllApprovedCompanies();
  const company = companies[0]; // RRA
  const branchId = COMPANY_WIDE_BRANCH_ID;
  const { User, Role } = await companyService().getCompanyDatabase(company.dbName);
  const user = await User.findOne({
    where: { roleId: 1 },
    include: [
      {
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'role'],
      },
    ],
    raw: true,
    nest: true,
  });
  console.log(company.name);
  console.log(user.firstName);

  const theDate = '2022-09-26';
  const currentDate = moment(theDate).format('YYYY-MM-DD');
  const previousDayDate = moment(currentDate).subtract(1, 'days').format('YYYY-MM-DD');
  const currentDayDateRange = {
    start: currentDate,
    end: currentDate,
  };
  const previousDayDateRange = {
    start: previousDayDate,
    end: previousDayDate,
  };

  const totalRepossessions = await reportService().getRepossessions(
    company,
    branchId,
    user,
    currentDayDateRange,
    previousDayDateRange,
  );

  console.log('Total Repossessions:', currentDate, totalRepossessions);

  return;
};

run()
  .catch(console.error)
  .finally(() => {
    console.log('Test Finished');
    process.exit();
  });
