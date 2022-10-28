const moment = require('moment');
const momentDurationFormatSetup = require('moment-duration-format');
const { serverLogger } = require('../config/logger');
const {
  DEFAULT_SERVER_LABEL,
  DEFAULT_SERVER_TIMEZONE,
  DEFAULT_SERVER_TIMEZONE_VALUE,
} = require('../constants/app.constants');
const { PlatformCompany } = require('../database/models');

const systemService = () => {
  const companyService = require('./company.service');
  const setServerTime = async (dbName, reqData) => {
    const { ServerTime } = await companyService().getCompanyDatabase(dbName);
    await ServerTime.destroy({
      where: {},
      truncate: true,
    });
    const serverTime = await ServerTime.create({
      label: reqData.label,
      timezone: reqData.timezone,
      timezoneOffset: reqData.timezoneOffset,
    });
    return serverTime;
  };

  const getServerTime = async (dbName) => {
    const { ServerTime } = await companyService().getCompanyDatabase(dbName);
    let serverTime = await ServerTime.findOne({ raw: true });
    if (!serverTime) {
      serverTime = {
        label: DEFAULT_SERVER_LABEL,
        timezone: DEFAULT_SERVER_TIMEZONE,
        timezoneOffset: DEFAULT_SERVER_TIMEZONE_VALUE,
      };
    }
    return serverTime;
  };

  const getImportProgress = async (dbName) => {
    momentDurationFormatSetup(moment);

    let platformCompany = {};

    // Find the database by name.
    try {
      platformCompany = await PlatformCompany.findOne({
        where: { dbName },
      });
    } catch (err) {
      serverLogger.log({
        operationName: 'PlatformCompany.findOne',
        message: `Get platformCompany query failed: ${err}`,
        payload: { dbName },
        level: 'error',
      });

      throw new Error('PlatformCompany.findOne query failed');
    }

    // If the data is up to date, return null.
    if (platformCompany.syncRdnFrom === null) return null;

    // Format the sync_rdn_from field to MM/DD/YYYY.
    const formatedDate = moment(platformCompany.syncRdnFrom).format('MM/DD/YYYY');

    // Return the formated date.
    return formatedDate;
  };

  return {
    setServerTime,
    getServerTime,
    getImportProgress,
  };
};

module.exports = systemService;
