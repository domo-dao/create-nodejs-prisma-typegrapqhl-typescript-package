const moment = require('moment');

const { LIMIT_MANUAL_SHIFTS_IN_HOURS, LIMIT_NORMAL_SHIFTS_IN_MINUTES } = require('../constants/app.constants');

/**
 * Validate if the shift time with the type "extraneous_time_tracked"
 * is over time. The constant for the over time is 10 hours.
 *
 * @param {Date} now moment current date.
 * @param {ShiftTime} shiftTime the shift time data.
 * @returns {Boolean} returns if the shift manual time is overtime or not.
 */
const validateIfManualTimeShiftIsOverTime = (now, shiftTime) => {
  const shiftHours = now.diff(moment(shiftTime.startTime), 'hours');

  return shiftHours >= LIMIT_MANUAL_SHIFTS_IN_HOURS;
};

/**
 * Validate if the shift with the type "normal_shift"
 * is over time. The constant for the over time is 15 minutes after the end time.
 *
 * @param {Date} now moment current date.
 * @param {ShiftTime} shiftTime the shift time data.
 * @returns {Boolean} returns if the shift manual time is overtime or not.
 */
const validateIfNormalShiftIsOverTime = (now, shiftTime) => {
  const shiftHours = now.diff(moment(shiftTime.shiftPeriodEndTime), 'minutes');

  return shiftHours >= LIMIT_NORMAL_SHIFTS_IN_MINUTES;
};

module.exports = {
  validateIfNormalShiftIsOverTime,
  validateIfManualTimeShiftIsOverTime,
};
