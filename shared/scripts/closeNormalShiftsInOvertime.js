const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const moment = require('moment');
const { map } = require('lodash');

const {
  SHIFT_STATUSES,
  END_SHIFT_TYPES,
  BREAK_TIME_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
} = require('../../server/constants/app.constants');

const alertService = require('../../server/services/alert.service');
const companyService = require('../../server/services/company.service');

const closeNormalShiftsInOvertime = async (company, normalOvertimeShifts) => {
  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

  // Extract the BreakTime and Location objects from the database.
  const { BreakTime, Location } = await companyService().getCompanyDatabase(company.dbName);

  await Promise.all(
    map(normalOvertimeShifts, async (shiftTime) => {
      shiftTime.status = SHIFT_STATUSES.ended;
      shiftTime.endShiftType = END_SHIFT_TYPES.system;
      shiftTime.endTime = currentTime;

      await shiftTime.save();

      // Close ongoing breaks if there are any.
      const onGoingBreak = await BreakTime.findOne({
        where: {
          shiftTimeId: shiftTime.id,
          type: BREAK_TIME_TYPES.break,
          endTime: null,
        },
        include: [
          {
            model: Location,
            as: 'locationMeta',
            attributes: ['lat', 'lng', 'address'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (onGoingBreak) {
        onGoingBreak.endTime = currentTime;
        await onGoingBreak.save();
      }

      // Close ongoing pauses if there are any.
      const onGoingPause = await BreakTime.findOne({
        where: {
          shiftTimeId: shiftTime.id,
          type: BREAK_TIME_TYPES.pause,
          endTime: null,
        },
        include: [
          {
            model: Location,
            as: 'locationMeta',
            attributes: ['lat', 'lng', 'address'],
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      if (onGoingPause) {
        onGoingPause.endTime = currentTime;
        await onGoingPause.save();
      }

      // Send a notification to the user.
      const notification = {
        userId: shiftTime.user.id,
        type: NOTIFICATION_TYPES.shift_end_over_time,
        color: NOTIFICATION_COLOR.shift_end_over_time,
        text: 'Your shift today has been ended automatically',
        notifyForUserId: shiftTime.user.id,
      };

      // End the user's shift.
      const payload = {
        title: 'Shift Notification',
        body: {
          type: NOTIFICATION_TYPES.shift_end_over_time,
          message: 'Your shift today has been ended automatically',
        },
      };

      await alertService().notifyUser(shiftTime.user, notification, payload, company);
    }),
  );
};

module.exports = {
  closeNormalShiftsInOvertime,
};
