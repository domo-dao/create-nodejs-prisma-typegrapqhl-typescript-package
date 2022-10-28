const Sequelize = require("sequelize");
const moment = require("moment");
const {
  COMPANY_WIDE_BRANCH_ID,
  ASSIGNED,
  RECEIVED,
  UNKNOWN_BRANCH_ID
} = require("../constants/app.constants");

const getTaskList = async (dbName, filter, params) => {
  const companyService = require("./company.service");
  const { branchId, timezoneOffset, startDate, endDate, type } = params;
  const {
    Task,
    TaskAction,
    User,
    Branch
  } = await companyService().getCompanyDatabase(dbName);
  const tasks = await Task.findAll({
    attributes: [
      "id",
      "name",
      "details",
      "urgency",
      "completionDate",
      "status",
      "readStatus",
      "completedAt",
      "createdAt",
      "updatedAt"
    ],
    where: {
      ...filter,
      ...(startDate &&
        endDate &&
        timezoneOffset && {
          createdAt: {
            [Sequelize.Op.gte]: moment(startDate)
              .startOf("day")
              .add(timezoneOffset, "hours")
              .format(),
            [Sequelize.Op.lte]: moment(endDate)
              .endOf("day")
              .add(timezoneOffset, "hours")
              .format()
          }
        })
    },
    include: [
      {
        model: User,
        as: "assignee",
        attributes: ["id", "firstName", "lastName", "avatarUrl", "branchId"],
        ...(type === RECEIVED && {
          where: {
            ...(branchId !== COMPANY_WIDE_BRANCH_ID &&
              branchId !== UNKNOWN_BRANCH_ID && {
                branchId
              }),
            ...(branchId === UNKNOWN_BRANCH_ID && {
              branchId: {
                [Sequelize.Op.eq]: null
              }
            })
          }
        }),
        include: [
          {
            model: Branch,
            as: "branch",
            attributes: ["id", "name"]
          }
        ]
      },
      {
        model: User,
        as: "assigner",
        attributes: ["id", "firstName", "lastName", "avatarUrl", "branchId"],
        ...(type === ASSIGNED && {
          where: {
            ...(branchId !== COMPANY_WIDE_BRANCH_ID &&
              branchId !== UNKNOWN_BRANCH_ID && {
                branchId
              }),
            ...(branchId === UNKNOWN_BRANCH_ID && {
              branchId: {
                [Sequelize.Op.eq]: null
              }
            })
          }
        }),
        include: [
          {
            model: Branch,
            as: "branch",
            attributes: ["id", "name"]
          }
        ]
      },
      {
        model: TaskAction,
        as: "action",
        attributes: [
          "id",
          "newCompletionDate",
          "note",
          "createdAt",
          "type",
          "reason"
        ]
      }
    ]
  });
  return tasks;
};

module.exports = {
  getTaskList
};
