const httpStatus = require("http-status");
const moment = require("moment");
const messageConstants = require("../constants/message.constants");
const {
  doTrackLocation,
  doTrackLocations
} = require("./cron-jobs/track-location-cron");
const APIError = require("../utils/APIError");
const { SHIFT_STATUSES } = require("../constants/app.constants");

const activeTrackings = {};
const lastLocationUpdates = {};

const trackingService = () => {
  const companyService = require("./company.service");
  const trackLocation = async (shiftTimeId, user, locationUpdate, company) => {
    const timestamp = moment().format();

    const { ShiftTime } = await companyService().getCompanyDatabase(
      company.dbName
    );

    const shiftTime = await ShiftTime.findOne({
      where: {
        id: shiftTimeId
      },
      raw: true
    });

    if (!shiftTime) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.USER_SHIFT_NOT_FOUND
      };
      throw new APIError(err);
    }

    if (lastLocationUpdates[shiftTime.id]) {
      const then = moment(lastLocationUpdates[shiftTime.id]);
      const now = moment(timestamp);

      const diff = now.diff(then, "seconds");

      if (diff <= 5) return;
    }

    lastLocationUpdates[shiftTime.id] = timestamp;

    // only save locations for status working's shift times
    if (shiftTime.status === SHIFT_STATUSES.working) {
      const activeShiftTime = {
        ...shiftTime,
        user
      };

      await doTrackLocation(company, activeShiftTime, locationUpdate);
    }
  };

  const trackLocations = async (
    shiftTimeId,
    user,
    locationUpdates,
    isOffline,
    company
  ) => {
    const { ShiftTime } = await companyService().getCompanyDatabase(
      company.dbName
    );

    const shiftTime = await ShiftTime.findOne({
      where: {
        id: shiftTimeId
      },
      raw: true
    });

    if (!shiftTime) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.USER_SHIFT_NOT_FOUND
      };
      throw new APIError(err);
    }

    if (activeTrackings[shiftTime.id]) {
      const err = {
        status: httpStatus.SERVICE_UNAVAILABLE,
        message: messageConstants.ALREADY_TRACKING
      };
      throw new APIError(err);
    }

    if (shiftTime.status === SHIFT_STATUSES.working) {
      activeTrackings[shiftTime.id] = true;
      const activeShiftTime = {
        ...shiftTime,
        user
      };

      try {
        await doTrackLocations(
          company,
          activeShiftTime,
          locationUpdates,
          isOffline
        );
      } catch (e) {
        //
      } finally {
        activeTrackings[shiftTime.id] = undefined;
      }
    }
  };
  return {
    trackLocation,
    trackLocations
  };
};

module.exports = trackingService;
