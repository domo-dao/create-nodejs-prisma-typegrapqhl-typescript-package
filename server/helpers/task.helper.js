const moment = require("moment");

const checkTaskDateWithPercentage = (
  now,
  createdAt,
  completionDate,
  percentage
) => {
  const createdDate = moment(createdAt);
  const diffInSeconds = moment(completionDate).diff(createdDate, "seconds");
  const nowInSeconds = moment(completionDate).diff(now, "seconds");
  const result = (nowInSeconds / diffInSeconds) * 100;

  return 100 - result >= percentage;
};

const checkTaskDateIsExpired = (now, completionDate) => {
  return moment(now).valueOf() >= moment(completionDate).valueOf();
};

module.exports = {
  checkTaskDateIsExpired,
  checkTaskDateWithPercentage
};
