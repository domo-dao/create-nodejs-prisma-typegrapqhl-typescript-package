const Queue = require("bull");
const { serverLogger } = require("../../config/logger");
const { redisHost, redisPort } = require("../../config/vars");
const {
  INFRACTION_TYPES,
  INFRACTION_STATUS
} = require("../../constants/app.constants");
const companyService = require("../company.service");

const saveAllInfractionJob = new Queue(
  "saveAllInfractionJob",
  `redis:${redisHost}:${redisPort}`
);

saveAllInfractionJob.process(async job => {
  let { infraction, userId, company, currentDateTime } = job.data;
  if (!userId || !currentDateTime) return;
  const { ShiftFeed, Infraction } = await companyService().getCompanyDatabase(
    company.dbName
  );
  try {
    const infractionTypes = [
      INFRACTION_TYPES.shift_start_later,
      INFRACTION_TYPES.shift_end_early,
      INFRACTION_TYPES.location_value_invalid,
      INFRACTION_TYPES.shift_inactivity,
      INFRACTION_TYPES.shift_being_idle,
      INFRACTION_TYPES.shift_break_over_time
    ];

    if (infractionTypes.includes(infraction.type)) {
      await Infraction.create({
        shiftFeedId: infraction.id,
        showAfter: currentDateTime,
        userId: infraction.userId,
        adminId: userId,
        objectId: infraction.objectId,
        type: infraction.type,
        reason: infraction.reason,
        status: INFRACTION_STATUS.draft,
        infractionTime: infraction.createdAt
      });
      const shiftFeed = await ShiftFeed.findOne({
        where: {
          id: infraction.id
        }
      });
      shiftFeed.expiryDate = currentDateTime;
      await shiftFeed.save();
    }
  } catch (error) {
    serverLogger.log({
      operationName: "saveAllInfractionJob",
      message: error.message,
      error: error,
      level: "error"
    });
  }
});

module.exports = saveAllInfractionJob;
