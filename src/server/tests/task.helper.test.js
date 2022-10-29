const {
  checkTaskDateWithPercentage,
  checkTaskDateIsExpired
} = require("../helpers/task.helper");

test("validate if task date is on 80% time remaining", () => {
  const now = "2022-04-23T10:25:00Z";
  const createdAt = "2022-04-23T10:00:00Z";
  const completionDate = "2022-04-23T10:30:00Z";
  const isPercentage = checkTaskDateWithPercentage(
    now,
    createdAt,
    completionDate,
    80
  );

  expect(isPercentage).toBe(true);
});

test("validate if task date is not on 80% time remaining", () => {
  const now = "2022-04-23T10:10:00Z";
  const createdAt = "2022-04-23T10:00:00Z";
  const completionDate = "2022-04-23T10:30:00Z";
  const isPercentage = checkTaskDateWithPercentage(
    now,
    createdAt,
    completionDate,
    80
  );

  expect(isPercentage).toBe(false);
});

test("validate if task date is expired", () => {
  const now = "2022-04-23T10:40:00Z";
  const completionDate = "2022-04-23T10:30:00Z";
  const isExpired = checkTaskDateIsExpired(now, completionDate);

  expect(isExpired).toBe(true);
});

test("validate if task date is not expired", () => {
  const now = "2022-04-23T10:12:00Z";
  const completionDate = "2022-04-23T10:30:00Z";
  const isExpired = checkTaskDateIsExpired(now, completionDate);

  expect(isExpired).toBe(false);
});
