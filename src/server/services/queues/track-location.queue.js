const moment = require("moment");
// const Queue = require("bull");
const locationService = require("../location.service");
const { serverLogger } = require("../../config/logger");
// const {
//   BREAK_TIME_TYPES,
//   MINIMUM_METER_FOR_ONE_SECOND
// } = require("../../constants/app.constants");
// const Utils = require("../../utils/util");
const { checkMotionOnShifts } = require("../cron-jobs/track-location-cron");
const companyService = require("../company.service");

/**
 * @deprecated - Use `doTrackLocation` from `track-location-cron.js` instead
 */
const trackLocation = async data => {
  try {
    const { requestBody, user, shiftTime } = data;

    if (!requestBody || !shiftTime || !user) return;

    const {
      // BreakTime,
      GeoLocation
    } = await companyService().getCompanyDatabase(user.company.dbName);

    const timestamp = moment().format();

    await checkMotionOnShifts(
      user.company,
      [{ ...shiftTime, user }],
      timestamp
    );

    const lastUsedLocationForMotionTrack = await GeoLocation.findOne({
      where: {
        shiftTimeId: shiftTime.id,
        usedForMotionTrack: true
      },
      order: [["endTrackTime", "DESC"]],
      raw: true
    });

    const distance = locationService().calculateDistance(
      lastUsedLocationForMotionTrack,
      requestBody
    );
    const location = await locationService().getOrSetLocation(
      {
        lat: requestBody.lat,
        lng: requestBody.lng
      },
      user.company
    );

    // const timeTakenToCoverDistance = Utils.timeDiffAsSeconds(
    //   timestamp,
    //   lastUsedLocationForMotionTrack.endTrackTime
    // );
    // const minimumDistanceRequired =
    //   timeTakenToCoverDistance * MINIMUM_METER_FOR_ONE_SECOND;
    //
    // let idleBreak;
    //
    // if (distance < minimumDistanceRequired) {
    //   idleBreak = await BreakTime.create({
    //     shiftTimeId: shiftTime.id,
    //     type: BREAK_TIME_TYPES.idle,
    //     startTime: lastUsedLocationForMotionTrack.endTrackTime,
    //     lat: requestBody.lat,
    //     lng: requestBody.lng,
    //     location: location && location.address,
    //     locationId: location && location.id
    //   });
    // }

    await GeoLocation.create({
      shiftTimeId: shiftTime.id,
      lat: requestBody.lat,
      lng: requestBody.lng,
      startTrackTime: lastUsedLocationForMotionTrack.endTrackTime,
      endTrackTime: timestamp,
      usedForMotionTrack: true,
      locationId: location && location.id,
      allowedIntervalCheckpoint: false,
      distance: distance
    });

    // if (idleBreak) {
    //   idleBreak.endTime = geoLocation.endTrackTime;
    //   await idleBreak.save();
    // }
  } catch (error) {
    serverLogger.log({
      operationName: "trackLocation",
      message: error.message,
      error: error,
      level: "error"
    });
  }
};

module.exports = { trackLocation };
