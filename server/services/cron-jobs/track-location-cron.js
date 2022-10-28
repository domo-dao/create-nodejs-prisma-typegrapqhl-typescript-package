const moment = require("moment");
const Sequelize = require("sequelize");

const shiftService = require("../shift.service");
const locationService = require("../location.service");
const {
  SECONDS_BEFORE_OFFLINE_TRACKING
} = require("../../constants/app.constants");

const motionTrackerBetaTesters = new Set([
  "gantoreno@yopmail.com",
  "gantoreno+2@yopmail.com",
  "bhamilton@rapidrecoveryagency.com",
  "ijohnson1996@yahoo.com",
  "Jamilmejias6471@gmail.com",
  "gryschules@gmail.com",
  "Unsung.mute08@gmail.com",
  "dagreatest.him86@gmail.com",
  "doha_diciano@hotmail.com",
  "ampvtec2649@gmail.com",
  "6yvonne7@gmail.com",
  "d@rra.com",
  "b@rra.com",
  "dhaval@test.com",
  "rodolfofuertes13@gmail.com",
  "alacret@cobuildlab.com"
]);

const doTrackLocation = async (
  company,
  activeShiftTime,
  currentLocationUpdate
) => {
  const companyService = require("../company.service");
  const { GeoLocation } = await companyService().getCompanyDatabase(
    company.dbName
  );
  const currentDateTime = moment().format();

  const { lastLocationUpdate } = await shiftService().checkMotionOnShifts(
    company,
    [activeShiftTime],
    currentDateTime
  );

  const distance = locationService().calculateDistance(
    lastLocationUpdate ?? currentLocationUpdate,
    currentLocationUpdate
  );
  const location = await locationService().getOrSetLocation(
    {
      lat: currentLocationUpdate.lat,
      lng: currentLocationUpdate.lng
    },
    company
  );

  await GeoLocation.create({
    shiftTimeId: activeShiftTime.id,
    lat: currentLocationUpdate.lat,
    lng: currentLocationUpdate.lng,
    startTrackTime: lastLocationUpdate?.endTrackTime ?? moment().format(),
    endTrackTime: currentDateTime,
    usedForMotionTrack: true,
    locationId: location && location.id,
    allowedIntervalCheckpoint: false,
    distance: distance
  });
};

const doTrackLocations = async (
  company,
  activeShiftTime,
  locationUpdates,
  isOffline = false
) => {
  const companyService = require("../company.service");
  const { GeoLocation } = await companyService().getCompanyDatabase(
    company.dbName
  );

  let lastLocationUpdate = await GeoLocation.findOne({
    where: {
      shiftTimeId: activeShiftTime.id,
      usedForMotionTrack: true,
      notifyType: {
        [Sequelize.Op.is]: null
      }
    },
    raw: true,
    order: [["endTrackTime", "DESC"]]
  });

  const isOfflinePathReconstruction =
    moment().diff(moment(lastLocationUpdate.endTrackTime), "seconds") >=
      SECONDS_BEFORE_OFFLINE_TRACKING && locationUpdates.length > 1;

  for (let currentLocationUpdate of locationUpdates) {
    const currentDateTime = moment(currentLocationUpdate.timestamp);

    const distance = locationService().calculateDistance(
      lastLocationUpdate ?? currentLocationUpdate,
      currentLocationUpdate
    );
    const location = await locationService().getOrSetLocation(
      {
        lat: currentLocationUpdate.lat,
        lng: currentLocationUpdate.lng
      },
      company
    );

    lastLocationUpdate = await GeoLocation.create({
      shiftTimeId: activeShiftTime.id,
      lat: currentLocationUpdate.lat,
      lng: currentLocationUpdate.lng,
      startTrackTime: lastLocationUpdate.endTrackTime,
      endTrackTime: currentLocationUpdate.timestamp,
      usedForMotionTrack: true,
      locationId: location && location.id,
      createdAt: currentLocationUpdate.timestamp,
      allowedIntervalCheckpoint: false,
      distance: distance,
      offline: isOffline
    });
    await shiftService().checkMotionOnShifts(
      company,
      [activeShiftTime],
      currentDateTime,
      isOfflinePathReconstruction
    );
  }

  if (!isOffline) {
    const currentDateTime = moment().format();

    await shiftService().checkMotionOnShifts(
      company,
      [activeShiftTime],
      currentDateTime
    );
  }
};

module.exports = {
  doTrackLocation,
  doTrackLocations,
  motionTrackerBetaTesters
};
