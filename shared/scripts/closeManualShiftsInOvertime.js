const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { map } = require('lodash');
const moment = require('moment');

const {
  SHIFT_STATUSES,
  END_SHIFT_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
} = require('../../server/constants/app.constants');

const alertService = require('../../server/services/alert.service');
const companyService = require('../../server/services/company.service');

const closeManualShiftsInOvertime = async (company, manualOvertimeShifts) => {
  const currentTime = moment().format('YYYY-MM-DD HH:mm:ss');

  // Fetch the users from the database for later use.
  const users = await companyService().getUsersList(company);

  await Promise.all(
    map(manualOvertimeShifts, async (shiftTime) => {
      shiftTime.status = SHIFT_STATUSES.ended;
      shiftTime.endShiftType = END_SHIFT_TYPES.system;
      shiftTime.endTime = currentTime;

      // Filter the user that's in overtime.
      shiftTime.user = users.filter((user) => shiftTime.userId === user.id);
      await shiftTime.save();

      // Send a notification to the user.
      const notification = {
        userId: shiftTime.user[0].id,
        type: NOTIFICATION_TYPES.shift_end_over_time,
        color: NOTIFICATION_COLOR.shift_end_over_time,
        text: 'Your manual shift has been ended automatically',
        notifyForUserId: shiftTime.user[0].Id,
      };

      // End the user's shift.
      const payload = {
        title: 'Shift Notification',
        body: {
          type: NOTIFICATION_TYPES.shift_end_over_time,
          message: 'Your manual shift has been ended automatically',
        },
      };

      await alertService().notifyUser(shiftTime.user[0], notification, payload, company);
    }),
  );
};

module.exports = {
  closeManualShiftsInOvertime,
};
