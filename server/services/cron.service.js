const {
  doSendTaskReminders,
  doMarkUncompletedTasks
} = require("./cron-jobs/task-cron");
const {
  doCalcShiftCommissions,
  // doTrackUserActivities,
  doCloseOverShiftTimes
} = require("./cron-jobs/shift-cron");
// const { doCalculateIdleLocation } = require("./cron-jobs/track-location-cron");
// const {
//   doDailyReporToManagers,
//   doCheckServerTimeChangeRestartJobs
// } = require("./cron-jobs/report-cron");
const { PlatformCompany } = require("../database/models");
const { serverLogger } = require("../config/logger");
const {
  DEFAULT_SERVER_TIMEZONE,
  COMPANY_USER_STATUS
} = require("../constants/app.constants");

const cronService = () => {
  const companyService = require("./company.service");
  // Get Server Time
  const getServerTime = async company => {
    const { ServerTime } = await companyService().getCompanyDatabase(
      company.dbName
    );
    const serverTime = await ServerTime.findOne();
    return serverTime ? serverTime.timezone : DEFAULT_SERVER_TIMEZONE;
  };

  // Running Task Cron jobs
  const startTaskCronJobs = company => {
    doSendTaskReminders(company);
    doMarkUncompletedTasks(company);
  };

  // Running Shift Cron jobs
  const startShiftCronJobs = company => {
    doCalcShiftCommissions(company);
    // doTrackUserActivities(company);
    doCloseOverShiftTimes(company);
  };

  // // Running Shift Cron jobs
  // const startTrackLocationJobs = company => {
  //   doCalculateIdleLocation(company);
  // };

  // Running Daily Report Cron jobs
  // const startDailyReportCronJobs = company => {
  //   doDailyReporToManagers(company);
  //   doCheckServerTimeChangeRestartJobs(company);
  // };

  const start = async () => {
    try {
      const companies = await PlatformCompany.findAll({
        where: {
          status: COMPANY_USER_STATUS.approved
        },
        raw: true
      });
      await Promise.all(
        companies.map(async company => {
          const serverTime = await getServerTime(company);
          if (!global.serverTime) global.serverTime = {};
          global.serverTime[company.dbName] = serverTime;
          startShiftCronJobs(company);
          startTaskCronJobs(company);
          // startDailyReportCronJobs(company);
          // startTrackLocationJobs(company);
        })
      );
    } catch (error) {
      serverLogger.log({
        operationName: "start",
        message: error.message || "cron service start error",
        error: error,
        level: "error"
      });
      return process.exit(1);
    }
  };

  return {
    start
  };
};

module.exports = cronService;
