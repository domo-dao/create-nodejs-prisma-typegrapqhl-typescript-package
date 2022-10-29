const Sequelize = require("sequelize");
const cron = require("node-cron");
const moment = require("moment");
const { get } = require("lodash");
const { cronShiftLogger } = require("../../config/logger");
const Utils = require("../../utils/util");
const locationService = require("../location.service");
const alertService = require("../alert.service");
const shiftAdminService = require("../shift-admin.service");
const {
  SHIFT_FEED_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
  SHIFT_FEED_TYPES,
  MANUAL_TIME_MOTION_TRACKER_INTERVAL_MINUTES,
  NOTIFICATION_TEXTS,
  SHIFT_INFRACTION_BREAK_OVERTIME_LIMIT_MINUTES
} = require("../../constants/app.constants");

const doCheckShiftBreakOverTime = async (
  scheduleDate,
  breakTimeId,
  company
) => {
  const companyService = require("../company.service");
  try {
    cronShiftLogger.info("doCheckShiftBreakOverTime cron job");
    const {
      BreakTime,
      TimeClock,
      ShiftTime,
      GeoLocation,
      User,
      ShiftFeed
    } = await companyService().getCompanyDatabase(company.dbName);
    const job = cron.schedule(formatDate(scheduleDate), async () => {
      job.stop();
      const breakTime = await BreakTime.findOne({
        where: {
          id: breakTimeId,
          endTime: {
            [Sequelize.Op.eq]: null
          }
        }
      });
      if (breakTime) {
        try {
          const [
            allotedBreak,
            currentBreakShiftTime,
            lastGeoLocation,
            overBreakShiftFeed
          ] = await Promise.all([
            TimeClock.findOne({
              attributes: ["id", "name", "allowedTime"],
              where: {
                id: breakTime.timeClockId
              },
              raw: true
            }),
            ShiftTime.findOne({
              where: {
                id: breakTime.shiftTimeId
              },
              include: [
                {
                  model: User,
                  as: "user"
                }
              ]
            }),
            GeoLocation.findOne({
              where: {
                shiftTimeId: breakTime.shiftTimeId
              },
              order: [["createdAt", "DESC"]]
            }),
            ShiftFeed.findOne({
              where: {
                objectId: breakTime.id,
                type: SHIFT_FEED_TYPES.shift_break_over_time
              }
            })
          ]);
          if (!overBreakShiftFeed) {
            if (currentBreakShiftTime && lastGeoLocation && allotedBreak) {
              const currentDateTime = moment().format();
              const infractionTimes =
                Utils.timeDiffAsMinutes(currentDateTime, breakTime.startTime) -
                (allotedBreak.allowedTime ||
                  MANUAL_TIME_MOTION_TRACKER_INTERVAL_MINUTES);
              if (
                allotedBreak &&
                infractionTimes >= SHIFT_INFRACTION_BREAK_OVERTIME_LIMIT_MINUTES
              ) {
                const location = await locationService().getOrSetLocation(
                  {
                    lat: lastGeoLocation.lat,
                    lng: lastGeoLocation.lng
                  },
                  company
                );

                const notifyFeed = await alertService().notifyShiftFeed(
                  {
                    userId: currentBreakShiftTime.user.id,
                    objectId: breakTime.id,
                    category: SHIFT_FEED_CATEGORIES.infraction,
                    type: SHIFT_FEED_TYPES.shift_break_over_time
                  },
                  company,
                  lastGeoLocation
                );

                const payloadForPushNotification = {
                  id: breakTime.id,
                  lat: lastGeoLocation.lat,
                  lng: lastGeoLocation.lng,
                  location: get(location, "address", "Unknown Location"),
                  startTime: breakTime.startTime,
                  endTime: currentDateTime,
                  allotedBreak,
                  infractionTimes,
                  userName:
                    currentBreakShiftTime.user.firstName +
                    " " +
                    currentBreakShiftTime.user.lastName,
                  colorCode: NOTIFICATION_COLOR.shift_break_over_time
                };

                const notificationForManagers = {
                  type: NOTIFICATION_TYPES.shift_break_over_time,
                  color: NOTIFICATION_COLOR.shift_break_over_time,
                  text: `went over break time - ${allotedBreak.name}`,
                  notifyForUserId: currentBreakShiftTime.user.id,
                  shiftTimeId: currentBreakShiftTime.id
                };

                const payloadForManagers = {
                  title: NOTIFICATION_TEXTS.shift_break_over_time,
                  body: {
                    type: NOTIFICATION_TYPES.shift_break_over_time,
                    message: `${
                      currentBreakShiftTime.user.firstName +
                      " " +
                      currentBreakShiftTime.user.lastName
                    } went over break time - ${allotedBreak.name}`,
                    details: {
                      ...payloadForPushNotification,
                      shiftFeedId: notifyFeed.id
                    }
                  }
                };

                const notificationForUser = {
                  userId: currentBreakShiftTime.user.id,
                  type: NOTIFICATION_TYPES.shift_break_over_time,
                  color: NOTIFICATION_COLOR.shift_break_over_time,
                  text: `You went over break time - ${allotedBreak.name}`,
                  notifyForUserId: currentBreakShiftTime.user.id,
                  shiftTimeId: currentBreakShiftTime.id
                };
                const payloadForUser = {
                  title: NOTIFICATION_TEXTS.shift_break_over_time,
                  body: {
                    type: NOTIFICATION_TYPES.shift_break_over_time,
                    color: NOTIFICATION_COLOR.shift_break_over_time,
                    message: `You went over break time - ${allotedBreak.name}`,
                    details: payloadForPushNotification
                  }
                };

                await Promise.all([
                  alertService().notifyManagers(
                    currentBreakShiftTime.user,
                    notificationForManagers,
                    payloadForManagers,
                    company
                  ),
                  alertService().notifyUser(
                    currentBreakShiftTime.user,
                    notificationForUser,
                    payloadForUser,
                    company
                  ),
                  shiftAdminService().autoSaveInfraction(notifyFeed, company)
                ]);
              }
            }
          }
        } catch (err) {
          console.log(err);
        }
      }
    });
  } catch (error) {
    cronShiftLogger.log({
      operationName: "doCheckShiftBreakOverTime",
      message: "doCheckShiftBreakOverTime cron job error",
      error: {
        message: error.message,
        stack: error.stack
      },
      level: "error"
    });
  }
};

function formatDate(date) {
  /* take care of the values:
    second: 0-59 same for javascript
    minute: 0-59 same for javascript
    hour: 0-23 same for javascript
    day of month: 1-31 same for javascript
    month: 1-12 (or names) is not the same for javascript 0-11
    day of week: 0-7 (or names, 0 or 7 are sunday) same for javascript
  */
  const scheduleDateFormat = new Date(date);
  return `${scheduleDateFormat.getSeconds()} ${scheduleDateFormat.getMinutes()} ${scheduleDateFormat.getHours()} ${scheduleDateFormat.getDate()} ${
    scheduleDateFormat.getMonth() + 1
  } ${scheduleDateFormat.getDay()}`;
}

module.exports = {
  doCheckShiftBreakOverTime
};
