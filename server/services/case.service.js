const httpStatus = require('http-status');
const moment = require('moment');
const { includes } = require('lodash');

const companyService = require('../services/company.service');
const messageConstants = require('../constants/message.constants');
const shiftService = require('../services/shift.service');
const APIError = require('../utils/APIError');
const {
  MANAGER_ROLES,
  SPOTTED_VEHICLE_LIMITI_TIME_HOURS,
  USER_ACTIVITIES,
  LOCAL_EVENTS,
} = require('../constants/app.constants');
const alertService = require('./alert.service');

const caseService = () => {
  const spottedVehicle = async (caseId, reqData, user, geoCoords, dbName) => {
    const { Case, UserActivity } = await companyService().getCompanyDatabase(dbName);

    const spottedCase = await Case.findOne({
      where: {
        caseId: caseId,
      },
    });
    if (!spottedCase) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.CASE_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }

    if (reqData.impersonatedSpotter) {
      const userRole = user.role.role;
      if (includes(MANAGER_ROLES, userRole)) {
        spottedCase.spotterId = reqData.impersonatedSpotter;
      } else {
        const err = {
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: messageConstants.SPOTTED_VEHICLE_IMPERSONATE_PERMISSION,
        };
        throw new APIError(err);
      }
    } else {
      if (spottedCase.spotterId && spottedCase.spottedDate) {
        const passedTimeFromSpotting = moment().diff(moment(spottedCase.spottedDate), 'hours');
        if (spottedCase.spotterId !== user.id && passedTimeFromSpotting < SPOTTED_VEHICLE_LIMITI_TIME_HOURS) {
          const err = {
            status: httpStatus.UNPROCESSABLE_ENTITY,
            message: messageConstants.SPOTTED_VEHICLE_TIME_LIMIT,
          };
          throw new APIError(err);
        }
      }
      spottedCase.spotterId = user.id;
    }
    spottedCase.spottedNote = reqData.spottedNote;
    spottedCase.spottedAddress = reqData.spottedAddress;
    spottedCase.spottedLat = geoCoords.lat;
    spottedCase.spottedLng = geoCoords.lng;
    spottedCase.spottedDate = moment().format();

    const spottedBranchResponse = await shiftService().getSubBranchIdBasedOnAddressNew(
      reqData.zipCode,
      reqData.spottedAddress,
      spottedCase.vendorBranchName,
      dbName,
    );

    if (!spottedBranchResponse.success) {
      throw new APIError(spottedBranchResponse);
    }
    spottedCase.spottedBranchId = spottedBranchResponse.subBranch.id;
    spottedCase.spottedVendorBranchId = spottedBranchResponse.subBranch.rdnBranchId;
    spottedCase.spottedZipCode = reqData.zipCode;
    await Promise.all([
      spottedCase.save(),
      UserActivity.create({
        userId: spottedCase.spotterId,
        caseId: spottedCase.caseId,
        updateNote: `has spotted a vehicle ${reqData.spottedAddress ? `at ${reqData.spottedAddress}` : ``} ${
          reqData.spottedNote !== '' ? `with note ${reqData.spottedNote}` : ''
        }`,
        type: USER_ACTIVITIES.rdn,
        targetUserId: user.id,
        updateTime: spottedCase.spottedDate,
      }),
    ]);

    await alertService().pingDashboard({ dbName }, LOCAL_EVENTS.refresh_dashboard);

    return spottedCase;
  };

  return { spottedVehicle };
};

module.exports = caseService;
