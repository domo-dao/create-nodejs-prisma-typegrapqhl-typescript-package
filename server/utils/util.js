const httpStatus = require('http-status');
const moment = require('moment-timezone');
const AWS = require('aws-sdk');
const { groupBy, keys, orderBy, reduce, isNil } = require('lodash');
var fs = require('fs');

const { awsAccessKeyId, awsSecretAccessKey, awsRegion } = require('../config/vars');
const {
  VALID_IMAGE_TYPES,
  COMPANY_WIDE,
  UNKNOWN,
  COMPANY_WIDE_BRANCH_ID,
  UNKNOWN_BRANCH_ID,
} = require('../constants/app.constants');
const messageConstants = require('../constants/message.constants');
const APIError = require('./APIError');

let __BRANCHES__ = {};
let __MAIN_BRANCHES__ = {};
let __SUB_BRANCHES__ = {};
let __MAIN_BRANCHES_IDS__ = [];
let __SUB_BRANCHES_IDS__ = [];
let __BRANCH_IDS__ = {};
let __BRANCH_NAME_WITH_SUB_BRANCH_IDS__ = {};

async function getSubBranches(branchId, dbName, attributes = []) {
  const companyService = require('../services/company.service');
  const { SubBranch } = await companyService().getCompanyDatabase(dbName);
  const subBranches = await SubBranch.findAll({
    ...(attributes.length && {
      attributes,
    }),
    ...(branchId && {
      where: {
        branchId,
      },
    }),
  });
  return subBranches;
}

async function getBranchAndSubBranches(dbName) {
  const companyService = require('../services/company.service');
  const { Branch } = await companyService().getCompanyDatabase(dbName);
  const branches = await Branch.findAll();
  let branchesAndSubBranches = {};
  let branchesAndSubBranchesIds = {};
  let branchesAndSubBranchesNameAndIds = {};
  branchesAndSubBranches[COMPANY_WIDE] = [];
  branchesAndSubBranches[UNKNOWN] = [];
  branchesAndSubBranchesNameAndIds[COMPANY_WIDE] = [];
  branchesAndSubBranchesNameAndIds[UNKNOWN] = [];
  branchesAndSubBranchesIds[COMPANY_WIDE_BRANCH_ID] = [];
  branchesAndSubBranchesIds[UNKNOWN_BRANCH_ID] = [];
  let mainBranches = {
    company_wide: COMPANY_WIDE,
    unknown: UNKNOWN,
  };

  const subBranchesByDB = [];
  let totalSubBranchIds = [];
  let mainBranchIds = [];
  mainBranchIds = [...mainBranchIds, COMPANY_WIDE_BRANCH_ID, UNKNOWN_BRANCH_ID];
  await Promise.all(
    branches.map(async (branch) => {
      mainBranchIds.push(branch.id);
      const subBranches = await getSubBranches(branch.id, dbName);
      const subBranchNames = subBranches.map((subBranch) => subBranch.name);
      const subBranchIds = subBranches.map((subBranch) => subBranch.id);
      totalSubBranchIds = totalSubBranchIds.concat(subBranchIds);
      subBranchNames.map((subBranchName) => {
        subBranchesByDB.push(subBranchName);
      });
      branchesAndSubBranches[branch.name] = subBranchNames || {};
      branchesAndSubBranchesIds[branch.id] = subBranchIds;
      branchesAndSubBranchesNameAndIds[branch.name] = subBranchIds;
      mainBranches[branch.name] = branch.name;
      if (branch.id === UNKNOWN_BRANCH_ID) {
        branchesAndSubBranchesIds[branch.id] = [UNKNOWN_BRANCH_ID];
        branchesAndSubBranchesNameAndIds[branch.name] = [UNKNOWN_BRANCH_ID];
      }
    }),
  );
  branchesAndSubBranchesIds[UNKNOWN_BRANCH_ID] = [UNKNOWN_BRANCH_ID];
  branchesAndSubBranchesNameAndIds[UNKNOWN] = [UNKNOWN_BRANCH_ID];
  if (subBranchesByDB && subBranchesByDB.length) {
    __SUB_BRANCHES__[dbName] = subBranchesByDB;
  }
  __BRANCHES__[dbName] = branchesAndSubBranches;
  __MAIN_BRANCHES__[dbName] = mainBranches;
  __BRANCH_IDS__[dbName] = branchesAndSubBranchesIds;
  __SUB_BRANCHES_IDS__[dbName] = totalSubBranchIds;
  __MAIN_BRANCHES_IDS__[dbName] = mainBranchIds;
  __BRANCH_NAME_WITH_SUB_BRANCH_IDS__[dbName] = branchesAndSubBranchesNameAndIds;
}

function getAllBranches(dbName) {
  let branches = [];
  Object.keys(__BRANCHES__[dbName]).map((branch) => {
    const branchLocations = __BRANCHES__[dbName][branch];
    branches = [...branches, ...branchLocations];
  });

  return branches;
}

function getBranches(dbName) {
  return __BRANCHES__[dbName];
}

function getMainBranches(dbName) {
  return __MAIN_BRANCHES__[dbName];
}

function convertBranch(e, dbName) {
  let mainBranchName = UNKNOWN;
  Object.keys(__BRANCHES__[dbName]).map((branchName) => {
    if (__BRANCHES__[dbName][branchName].includes(e)) {
      mainBranchName = branchName;
    }
  });
  return mainBranchName;
}

function convertBranchBySubBranchId(spottedBranchId, dbName) {
  let mainBranch = UNKNOWN;
  Object.keys(__BRANCH_NAME_WITH_SUB_BRANCH_IDS__[dbName]).map((branchId) => {
    if (__BRANCH_NAME_WITH_SUB_BRANCH_IDS__[dbName][branchId].includes(spottedBranchId)) {
      mainBranch = branchId;
    }
  });
  return mainBranch;
}

function getYearlyStartEndDates(year) {
  return { start: `${year}-01-01`, end: `${year}-12-31 23:59:59` };
}

async function getYTDStartEndDates(year, now, company) {
  const systemService = require('../services/system.service');

  const serverTime = await systemService().getServerTime(company.dbName);

  return {
    start: moment(`${year}-01-01`).tz(serverTime.timezone).startOf('day').utc().format(),
    end: moment(`${year}-${now.format('MM-DD')}`)
      .tz(serverTime.timezone)
      .endOf('day')
      .utc()
      .format(),
  };
}

function getMTDStartEndDates(year, now, timezoneOffset) {
  return {
    start: moment(`${year}-${now.subtract(timezoneOffset, 'hours').format('MM')}-01`)
      .add(timezoneOffset || 0, 'hours')
      .format(),
    end: moment(`${year}-${now.subtract(timezoneOffset, 'hours').format('MM-DD')} 23:59:59`)
      .add(timezoneOffset || 0, 'hours')
      .format(),
  };
}

function groupByBranch(cases, dbName) {
  if (isNil(cases)) return {};
  let _cases = groupBy(cases, (a) => convertBranch(a.vendorBranchName || a.repossessedBranchName, dbName));
  keys(_cases).map((item) => {
    _cases[item] = reduce(_cases[item], (a, b) => a + b.count, 0);
  });

  return _cases;
}

function groupByBranchById(cases, dbName) {
  if (isNil(cases)) return {};
  let _cases = groupBy(cases, (a) => convertBranchBySubBranchId(a.spottedBranchId, dbName));
  keys(_cases).map((item) => {
    _cases[item] = reduce(_cases[item], (a, b) => a + b.count, 0);
  });

  return _cases;
}

function groupByBranchByDate(cases, groupByDate, dbName, bySubBranchId = false) {
  if (isNil(cases)) return {};
  let _cases;
  if (!bySubBranchId) {
    _cases = groupBy(cases, (a) => convertBranch(a.vendorBranchName || a.repossessedBranchName, dbName));
  } else {
    _cases = groupBy(cases, (a) => convertBranchBySubBranchId(a.spottedBranchId, dbName));
  }

  keys(_cases).map((item) => {
    _cases[item] = groupBy(_cases[item], (a) => `${moment(a[groupByDate], 'YYYY-MM-DD').format('YYYY-MM')}`);

    keys(_cases[item]).map((mm) => {
      _cases[item][mm] = reduce(_cases[item][mm], (a, b) => a + b.count, 0);
    });
  });

  return _cases;
}

function groupByBranchByClient(cases, dbName, bySubBranchId = false) {
  if (isNil(cases)) return {};
  let _cases;
  if (!bySubBranchId) {
    _cases = groupBy(cases, (a) => convertBranch(a.vendorBranchName || a.repossessedBranchName, dbName));
  } else {
    _cases = groupBy(cases, (a) => convertBranchBySubBranchId(a.spottedBranchId, dbName));
  }
  keys(_cases).map((item) => {
    const _groupByClientId = groupBy(_cases[item], (a) => a.lenderClientId);
    const groupByClient = [];
    keys(_groupByClientId).map((_clientId) => {
      const clientCases = _groupByClientId[_clientId];
      groupByClient.push({
        lenderClientId: clientCases[0].lenderClientId,
        lenderClientName: clientCases[0].lenderClientName,
        count: reduce(clientCases, (a, b) => a + b.count, 0),
      });
    });
    const _groupByRanks = orderBy(groupByClient, ['count'], 'desc');

    _cases[item] = _groupByRanks;
  });

  const companyWide = [];
  const _companyWide = groupBy(cases, (a) => a.lenderClientId);
  keys(_companyWide).map((item) => {
    companyWide.push({
      lenderClientId: item,
      lenderClientName: _companyWide[item][0].lenderClientName,
      count: reduce(_companyWide[item], (a, b) => a + b.count, 0),
    });
  });
  _cases['Company Wide'] = orderBy(companyWide, ['count'], 'desc');

  return _cases;
}

function groupByBranchByDriver(drivers, dbName, forSpotter = false) {
  if (isNil(drivers)) return {};
  let _drivers;
  if (forSpotter) {
    _drivers = groupBy(drivers, (a) => convertBranchBySubBranchId(a.spottedBranchId, dbName));
  } else {
    _drivers = groupBy(drivers, (a) => convertBranch(a.vendorBranchName || a.repossessedBranchName, dbName));
  }
  keys(_drivers).map((item) => {
    const _groupByDriverId = groupBy(_drivers[item], (a) => a.driverId);
    const groupByDriver = [];
    keys(_groupByDriverId).map((_driverId) => {
      const driverRepossesses = _groupByDriverId[_driverId];
      if (driverRepossesses.length) {
        groupByDriver.push({
          driverId: driverRepossesses[0].driverId,
          driverRdnId: driverRepossesses[0].driverRdnId,
          firstName: driverRepossesses[0].firstName,
          lastName: driverRepossesses[0].lastName,
          branchName: driverRepossesses[0].branchName,
          avatarUrl: driverRepossesses[0].avatarUrl,
          count: reduce(driverRepossesses, (a, b) => a + b.count, 0),
        });
      }
    });
    const _groupByRanks = orderBy(groupByDriver, ['count'], 'desc');
    _drivers[item] = _groupByRanks;
  });

  const companyWide = [];
  const _companyWide = groupBy(drivers, (a) => a.driverId);
  keys(_companyWide).map((item) => {
    companyWide.push({
      driverId: _companyWide[item][0].driverId,
      driverRdnId: _companyWide[item][0].driverRdnId,
      firstName: _companyWide[item][0].firstName,
      lastName: _companyWide[item][0].lastName,
      branchName: _companyWide[item][0].branchName,
      avatarUrl: _companyWide[item][0].avatarUrl,
      count: reduce(_companyWide[item], (a, b) => a + b.count, 0),
    });
  });
  _drivers['Company Wide'] = orderBy(companyWide, ['count'], 'desc');

  return _drivers;
}

function groupByBranchByDriverRdnId(drivers, dbName, forSpotter = false) {
  if (isNil(drivers)) return {};
  let _drivers;
  if (forSpotter) {
    _drivers = groupBy(drivers, (a) => convertBranchBySubBranchId(a.spottedBranchId, dbName));
  } else {
    _drivers = groupBy(drivers, (a) => convertBranch(a.vendorBranchName || a.repossessedBranchName, dbName));
  }

  keys(_drivers).map((item) => {
    const _groupByDriverId = groupBy(_drivers[item], (a) => a.driverRdnId);
    const groupByDriver = [];
    keys(_groupByDriverId).map((_driverId) => {
      const driverRepossesses = _groupByDriverId[_driverId];
      if (driverRepossesses.length) {
        groupByDriver.push({
          driverId: driverRepossesses[0].driverId,
          driverRdnId: driverRepossesses[0].driverRdnId,
          firstName: driverRepossesses[0].firstName,
          lastName: driverRepossesses[0].lastName,
          branchName: driverRepossesses[0].branchName,
          avatarUrl: driverRepossesses[0].avatarUrl,
          count: reduce(driverRepossesses, (a, b) => a + b.count, 0),
        });
      }
    });
    const _groupByRanks = orderBy(groupByDriver, ['count'], 'desc');
    _drivers[item] = _groupByRanks;
  });

  const companyWide = [];
  const _companyWide = groupBy(drivers, (a) => a.driverRdnId);
  keys(_companyWide).map((item) => {
    companyWide.push({
      driverId: _companyWide[item][0].driverId,
      driverRdnId: _companyWide[item][0].driverRdnId,
      firstName: _companyWide[item][0].firstName,
      lastName: _companyWide[item][0].lastName,
      branchName: _companyWide[item][0].branchName,
      avatarUrl: _companyWide[item][0].avatarUrl,
      count: reduce(_companyWide[item], (a, b) => a + b.count, 0),
    });
  });
  _drivers['Company Wide'] = orderBy(companyWide, ['count'], 'desc');

  return _drivers;
}

function getRound(num) {
  return parseFloat(num.toFixed(2));
}

function timeDiffAsSeconds(dt2, dt1) {
  const duration = moment.duration(moment(dt2).diff(moment(dt1)));
  return Math.floor(duration.asSeconds());
}

function timeDiffAsMinutes(dt2, dt1) {
  const duration = moment.duration(moment(dt2).diff(moment(dt1)));
  return Math.floor(duration.asMinutes());
}

function sec2time(timeInSeconds) {
  const pad = function (num, size) {
    return ('000' + num).slice(size * -1);
  };
  const [hours, minutes, seconds] = calculateTime(timeInSeconds);

  return (hours >= 10 ? hours : pad(hours, 2)) + 'h ' + pad(minutes, 2) + 'm ' + pad(seconds, 2) + 's';
}

function calculateTime(timeInSeconds) {
  const time = parseFloat(timeInSeconds).toFixed(3);
  const hours = Math.floor(time / 60 / 60);
  const minutes = Math.floor(time / 60) % 60;
  const seconds = Math.floor(time - minutes * 60);

  return [hours, minutes, seconds];
}

function calculatePercentage(currentValue, previousValue) {
  return ((100 * (currentValue - previousValue)) / previousValue).toFixed(2);
}

function nonZeroSec2time(timeInSeconds, showSeconds = true) {
  const pad = function (num, size) {
    return ('000' + num).slice(size * -1);
  };
  const [hours, minutes, seconds] = calculateTime(timeInSeconds);

  const totalHours = (hours >= 10 ? hours : pad(hours, 2)) + 'h ';
  const totalMinutes = pad(minutes, 2) + 'm ';
  const totalSeconds = showSeconds ? pad(seconds, 2) + 's' : '';
  let timeObj;
  if (hours > 0 && minutes > 0 && seconds > 0) {
    timeObj = totalHours + totalMinutes + totalSeconds;
  } else if (hours > 0 && minutes <= 0 && seconds > 0) {
    if (showSeconds) {
      timeObj = totalHours + totalMinutes + totalSeconds;
    } else {
      timeObj = totalHours;
    }
  } else if (hours > 0 && minutes <= 0 && seconds <= 0) {
    timeObj = totalHours;
  } else if (hours <= 0 && minutes > 0 && seconds > 0) {
    timeObj = totalMinutes + totalSeconds;
  } else if (hours <= 0 && minutes > 0 && seconds <= 0) {
    timeObj = totalMinutes;
  } else if ((hours <= 0 && minutes <= 0 && seconds > 0) || (hours <= 0 && minutes <= 0 && seconds <= 0)) {
    timeObj = totalSeconds;
  }
  return timeObj;
}

function makeID(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function createBucket(bucketName) {
  try {
    // Configure AWS to use promise
    AWS.config.update({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: awsRegion || 'us-east-1',
    });

    // Create an s3 instance
    const s3 = new AWS.S3();
    return await s3.createBucket({ Bucket: bucketName }).promise();
  } catch (error) {
    console.log(error);
  }
}

async function createFolder(bucketName, folderName) {
  try {
    // Configure AWS to use promise
    AWS.config.update({
      accessKeyId: awsAccessKeyId,
      secretAccessKey: awsSecretAccessKey,
      region: awsRegion || 'us-east-1',
    });

    // Create an s3 instance
    const s3 = new AWS.S3();
    await s3.putObject({ Bucket: bucketName, Key: `${folderName}/` }).promise();
  } catch (error) {
    console.log(error);
  }
}

async function fileUpload(file, bucket, userId) {
  // Configure AWS to use promise
  AWS.config.update({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion || 'us-east-1',
  });

  // Create an s3 instance
  const s3 = new AWS.S3();

  let currentDate = new Date();
  let fileName = `${userId}/${currentDate.getTime()}_${file.name}`;
  const fileData = fs.readFileSync(file.path);
  const params = {
    Bucket: bucket,
    Key: fileName,
    Body: fileData,
    ACL: 'public-read',
    ContentType: file.type, // required. Notice the back ticks
  };
  const { Location: location } = await s3.upload(params).promise();
  return location;
}

async function base64FileUpload(base64, fileName, bucket, fileType) {
  // Configure AWS to use promise
  AWS.config.update({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion || 'us-east-1',
  });

  // Create an s3 instance
  const s3 = new AWS.S3();

  // Ensure that you POST a base64 data to your server.
  // Let's assume the variable "base64" is one.
  const base64Data = new Buffer.from(base64.replace(/^data:\w+\/\w+;base64,/, ''), 'base64');

  // Getting the file type, ie: jpeg, png or gif
  const type = base64.split(';')[0].split('/')[1];
  if ((!fileType || (fileType && fileType.includes('image'))) && !VALID_IMAGE_TYPES.includes(type)) {
    const err = {
      status: httpStatus.UNPROCESSABLE_ENTITY,
      message: messageConstants.PLEASE_UPLOAD_VALID_IMAGE,
    };
    throw new APIError(err);
  }
  if (!fileType) {
    fileType = `image/${type}`;
  }
  console.log(fileType);
  const params = {
    Bucket: bucket,
    Key: `${fileName}`, // type is not required
    Body: base64Data,
    ACL: 'public-read',
    ContentEncoding: 'base64', // required
    ContentType: fileType, // required. Notice the back ticks
  };

  // The upload() is used instead of putObject() as we'd need the location url and assign that to our user profile/database
  // see: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
  const { Location: location } = await s3.upload(params).promise();
  return location;
}

function deleteImageFromAwsBucket(fileUrl, bucket) {
  // Configure AWS to use promise
  if (!fileUrl || !bucket) return;

  AWS.config.update({
    accessKeyId: awsAccessKeyId,
    secretAccessKey: awsSecretAccessKey,
    region: awsRegion || 'us-east-1',
  });

  // Create an s3 instance
  const s3 = new AWS.S3();

  const key = new URL(fileUrl).pathname.slice(1);
  const params = {
    Bucket: bucket,
    Key: key,
  };
  return s3.deleteObject(params).promise();
}

module.exports = {
  __BRANCHES__,
  __MAIN_BRANCHES__,
  __SUB_BRANCHES__,
  __MAIN_BRANCHES_IDS__,
  __SUB_BRANCHES_IDS__,
  __BRANCH_IDS__,
  __BRANCH_NAME_WITH_SUB_BRANCH_IDS__,
  getAllBranches,
  groupByBranch,
  groupByBranchByDate,
  groupByBranchByClient,
  groupByBranchByDriver,
  groupByBranchById,
  getYearlyStartEndDates,
  getYTDStartEndDates,
  getMTDStartEndDates,
  timeDiffAsSeconds,
  timeDiffAsMinutes,
  sec2time,
  nonZeroSec2time,
  getRound,
  makeID,
  base64FileUpload,
  deleteImageFromAwsBucket,
  fileUpload,
  calculatePercentage,
  getSubBranches,
  getBranchAndSubBranches,
  getBranches,
  getMainBranches,
  createBucket,
  createFolder,
  convertBranch,
  groupByBranchByDriverRdnId,
};
