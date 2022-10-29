const {
  validateIfNormalShiftIsOverTime,
  validateIfManualTimeShiftIsOverTime
} = require("../helpers/shift.helper");
const moment = require("moment");

test("validate if manual time shift is overtime", () => {
  const date = moment("2022-04-23T10:00:00Z");
  const shiftTime = {
    startTime: moment("2022-03-23T10:00:00Z").toISOString()
  };
  const isOverTime = validateIfManualTimeShiftIsOverTime(date, shiftTime);

  expect(isOverTime).toBe(true);
});

test("validate if manual time shift is not overtime", () => {
  const date = moment("2022-03-23T12:00:00Z");
  const shiftTime = {
    startTime: moment("2022-03-23T10:00:00Z").toISOString()
  };
  const isOverTime = validateIfManualTimeShiftIsOverTime(date, shiftTime);

  expect(isOverTime).toBe(false);
});

test("validate if normal shift is overtime", () => {
  const date = moment("2022-03-23T13:00:00Z");
  const shiftTime = {
    shiftPeriodEndTime: moment("2022-03-23T10:00:00Z").toISOString()
  };
  const isOverTime = validateIfNormalShiftIsOverTime(date, shiftTime);

  expect(isOverTime).toBe(true);
});

test("validate if normal shift is not overtime", () => {
  const date = moment("2022-03-23T08:00:00Z");
  const shiftTime = {
    shiftPeriodEndTime: moment("2022-03-23T10:00:00Z").toISOString()
  };
  const isOverTime = validateIfNormalShiftIsOverTime(date, shiftTime);

  expect(isOverTime).toBe(false);
});
