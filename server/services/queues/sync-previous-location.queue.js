const Queue = require("bull");
const { serverLogger } = require("../../config/logger");
const { redisHost, redisPort } = require("../../config/vars");
const companyService = require("../company.service");
const locationService = require("../location.service");
const syncPreviousLocationJob = new Queue(
  "saveAllInfractionJob",
  `redis:${redisHost}:${redisPort}`
);

syncPreviousLocationJob.process(async job => {
  let { existLocation, company, locationData } = job.data;
  if (!existLocation || !locationData) return;
  const { GeoLocation, BreakTime } = await companyService().getCompanyDatabase(
    company.dbName
  );
  try {
    const geoCoords = {
      lat: locationData.lat,
      lng: locationData.lng
    };
    if (geoCoords.lat && geoCoords.lng) {
      let location = existLocation[`${geoCoords.lat}_${geoCoords.lng}`];
      if (!location) {
        location = await locationService().getOrSetLocation(
          {
            ...geoCoords
          },
          company
        );
        existLocation[`${geoCoords.lat}_${geoCoords.lng}`] = location;
      }

      let tableToBeUpdate = locationData.endTrackTime ? GeoLocation : BreakTime;

      await tableToBeUpdate.update(
        {
          locationId: location && location.id
        },
        {
          where: {
            id: locationData.id
          }
        }
      );
    }
  } catch (error) {
    serverLogger.log({
      operationName: "syncPreviousLocationJob",
      message: error.message,
      error: error,
      level: "error"
    });
  }
});

module.exports = syncPreviousLocationJob;
