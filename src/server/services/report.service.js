const httpStatus = require('http-status');
const Sequelize = require('sequelize');
const moment = require('moment-timezone');
const { values, map, filter, sum, sumBy, find, orderBy, groupBy, uniq, findIndex } = require('lodash');
const db = require('../database/models');
const Utils = require('../utils/util');
const mailService = require('./mail.service');
const mapService = require('./map.service');
const systemService = require('./system.service');
const { emailDomain, emailReplyAddress, workerEnvironment } = require('../config/vars');
const {
  DEFAULT_SERVER_TIMEZONE,
  MANAGER_ROLES,
  MANUAL_TIME_MOTION_TRACKER_INTERVAL_MINUTES,
  SHIFT_TYPES,
  TIME_CLOCK_TYPES,
  BREAK_TIME_TYPES,
  USER_STATUS,
  DAILY,
  COMPANY_WIDE_BRANCH_ID,
  AGENT_UPDATE_TYPES,
  UNKNOWN_BRANCH_ID,
  SUPER_ADMIN_ROLE,
  SPOTTED_FROM_TIME,
  SPOTTED_TO_TIME,
  ASSIGNMENT_FROM_TIME,
  ASSIGNMENT_TO_TIME,
  REPOSSESSIONS_TO_TIME,
  REPOSSESSIONS_FROM_TIME,
  SPOTTED_NOT_SECURED_FROM_TIME,
  SPOTTED_NOT_SECURED_TO_TIME,
  CLIENT,
  USER,
  COMPANY_WIDE,
  CLIENT_AND_USER,
  SCANNED,
  SECURED,
  ALL_HITS,
} = require('../constants/app.constants');
const {
  CASE_STATUSES,
  CASE_STATUSES_RDN_MATCH,
  RDN_SERVER_TIME_ZONE_OFFSET,
  VOLUNTARY_ORDER_TYPES,
} = require('../rdn/constants');
const messageConstants = require('../constants/message.constants');
const APIError = require('../utils/APIError');
const { serverLogger } = require('../config/logger');

const reportService = () => {
  const companyService = require('./company.service');
  const getServerTime = async (dbName) => {
    const { ServerTime } = await companyService().getCompanyDatabase(dbName);
    const serverTime = await ServerTime.findOne();
    return serverTime ? serverTime.timezone : DEFAULT_SERVER_TIMEZONE;
  };

  const getMainBranches = async (company, user, branchId) => {
    const { Branch } = await companyService().getCompanyDatabase(company.dbName);
    let branch;
    let vendorBranchNames = [];
    if (
      (user.role.role === SUPER_ADMIN_ROLE &&
        branchId !== COMPANY_WIDE_BRANCH_ID &&
        branchId !== UNKNOWN_BRANCH_ID) ||
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (user.role.role !== SUPER_ADMIN_ROLE && branchId === COMPANY_WIDE_BRANCH_ID) {
        branchId = user.branchId;
      }
      branch = await Branch.findOne({
        ...(branchId !== UNKNOWN_BRANCH_ID && {
          where: {
            id: branchId,
          },
        }),
      });
      if (!branch) {
        const err = {
          status: httpStatus.FORBIDDEN,
          message: messageConstants.INVALID_BRANCH_ID,
        };
        throw new APIError(err);
      }
      if (
        (user.role.role !== SUPER_ADMIN_ROLE && branchId === user.branchId) ||
        user.role.role === SUPER_ADMIN_ROLE
      ) {
        vendorBranchNames = Utils.getBranches(company.dbName)[branch.name];
      } else {
        vendorBranchNames = [''];
      }
    }
    return vendorBranchNames;
  };

  const getSpottedBranchIds = async (company, user, branchId) => {
    const { Branch } = await companyService().getCompanyDatabase(company.dbName);
    let branch;
    let spottedBranchIds = [];
    if (
      (user.role.role === SUPER_ADMIN_ROLE &&
        branchId !== COMPANY_WIDE_BRANCH_ID &&
        branchId !== UNKNOWN_BRANCH_ID) ||
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (user.role.role !== SUPER_ADMIN_ROLE && branchId === COMPANY_WIDE_BRANCH_ID) {
        branchId = user.branchId;
      }
      branch = await Branch.findOne({
        ...(branchId !== UNKNOWN_BRANCH_ID && {
          where: {
            id: branchId,
          },
        }),
      });
      if (!branch) {
        const err = {
          status: httpStatus.FORBIDDEN,
          message: messageConstants.INVALID_BRANCH_ID,
        };
        throw new APIError(err);
      }
      if (
        (user.role.role !== SUPER_ADMIN_ROLE && branchId === user.branchId) ||
        user.role.role === SUPER_ADMIN_ROLE
      ) {
        spottedBranchIds = Utils.__BRANCH_IDS__[company.dbName][branch.id];
        if (!spottedBranchIds) {
          spottedBranchIds = [];
        }
      } else {
        spottedBranchIds = [''];
      }
    }
    return spottedBranchIds;
  };

  const getNewAssignments = async (company, branchId, user, currentDayDateRange, previousDayDateRange) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    const vendorBranchNames = await getMainBranches(company, user, branchId);
    const newAssignedCasesSql = ` SELECT
        *
      FROM
        cases
      WHERE
        status in (:status) AND
        order_date >=:start AND
        order_date <=:end
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND vendor_branch_name in (:vendorBranchNames)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
            : ``
        }
    `;

    console.log('server/services/report.service.js:getNewAssignments:', currentDayDateRange, serverTime);
    const startDate = moment(currentDayDateRange.start) // 12:00 am local
      .tz(serverTime.timezone, true)
      .set({ hours: ASSIGNMENT_FROM_TIME })
      .utc()
      .format();
    const endDate = moment(currentDayDateRange.end) // 11:59 am of local of next day
      .tz(serverTime.timezone, true)
      .set({ hours: ASSIGNMENT_TO_TIME })
      .utc()
      .add(1, 'days')
      .format();
    console.log('server/services/report.service.js:getNewAssignments:startDate', startDate);
    console.log('server/services/report.service.js:getNewAssignments:endDate', endDate);
    let [newAssignedCases, previousDayNewAssignmentsCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(newAssignedCasesSql, {
        replacements: {
          start: startDate,
          end: endDate,
          status: values(CASE_STATUSES_RDN_MATCH),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(newAssignedCasesSql, {
        replacements: {
          start: moment(previousDayDateRange.start) // 12:00 am local
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_FROM_TIME })
            .utc()
            .format(),
          end: moment(previousDayDateRange.end) // 11:59 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_TO_TIME })
            .utc()
            .add(1, 'days')
            .format(),
          status: values(CASE_STATUSES_RDN_MATCH),
          vendorBranchNames,
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let totalAssignedValue = newAssignedCases.length;
    let totalAssignedPreviousValue = previousDayNewAssignmentsCases.length;
    let newAssignedValues = {
      value: totalAssignedValue,
      previousValue: totalAssignedPreviousValue,
    };
    if (totalAssignedValue === 0 && totalAssignedPreviousValue === 0) {
      newAssignedValues = {
        ...newAssignedValues,
        percentage: 0,
      };
    } else if (totalAssignedValue !== 0 && totalAssignedPreviousValue === 0) {
      newAssignedValues = {
        ...newAssignedValues,
        percentage: 100,
      };
    } else {
      newAssignedValues = {
        ...newAssignedValues,
        percentage: Utils.calculatePercentage(totalAssignedValue, totalAssignedPreviousValue),
      };
    }
    return newAssignedValues;
  };

  const getRepossessions = async (company, branchId, user, currentDayDateRange, previousDayDateRange) => {
    const serverTime = await systemService().getServerTime(company.dbName);
    const repossessedBranchNames = await getMainBranches(company, user, branchId);

    const repossessionsQuery = ` SELECT 
        IF(
          (count is null),
          0,
          SUM(count)
        ) as count
      FROM
      (
        SELECT
          count(*) as count, repossessed_branch_name
        FROM
          cases
        WHERE
          status in (:status) AND
          rdn_repo_date >=:start AND
          rdn_repo_date <=:end
          ${
            (branchId !== COMPANY_WIDE_BRANCH_ID &&
              branchId !== UNKNOWN_BRANCH_ID &&
              user.role.role === SUPER_ADMIN_ROLE) ||
            user.role.role !== SUPER_ADMIN_ROLE
              ? `AND repossessed_branch_name in (:repossessedBranchNames)`
              : ``
          }
          ${
            branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
              ? `AND (repossessed_branch_name is null OR repossessed_branch_name not in (:subBranches))`
              : ``
          }
        GROUP BY
          repossessed_branch_name
      ) as repossessionCountByBranch
    `;

    const startDate = moment(currentDayDateRange.start)
      .tz(serverTime.timezone, true)
      .set({ hours: REPOSSESSIONS_FROM_TIME })
      .utc()
      .format();
    const endDate = moment(currentDayDateRange.end) // 9 am of local of next day
      .tz(serverTime.timezone, true)
      .set({ hours: REPOSSESSIONS_TO_TIME })
      .add(1, 'days')
      .utc()
      .format();
    const previousStartDate = moment(previousDayDateRange.start) // 9:01 am local
      .tz(serverTime.timezone, true)
      .set({ hours: REPOSSESSIONS_FROM_TIME })
      .utc()
      .format();
    const previousEndDate = moment(previousDayDateRange.end) // 9 am of local of next day
      .tz(serverTime.timezone, true)
      .set({ hours: REPOSSESSIONS_TO_TIME })
      .add(1, 'days')
      .utc()
      .format();
    console.log('server/services/report.service.js:getRepossessions:', currentDayDateRange);
    console.log('server/services/report.service.js:getRepossessions:startDate', startDate);
    console.log('server/services/report.service.js:getRepossessions:endDate', endDate);
    console.log('server/services/report.service.js:getRepossessions:previousStartDate', previousStartDate);
    console.log('server/services/report.service.js:getRepossessions:previousEndDate', previousEndDate);
    let [totalRepossessionsCases, previousDayTotalRepossessionsCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(repossessionsQuery, {
        replacements: {
          start: startDate,
          end: endDate,
          status: [CASE_STATUSES.repossessed],
          repossessedBranchNames: repossessedBranchNames.length ? repossessedBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(repossessionsQuery, {
        replacements: {
          start: previousStartDate,
          end: previousEndDate,
          status: [CASE_STATUSES.repossessed],
          repossessedBranchNames: repossessedBranchNames.length ? repossessedBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let totalRepossessedValue = totalRepossessionsCases.length
      ? JSON.parse(totalRepossessionsCases[0].count || 0)
      : 0;
    let totalRepossessedPreviousValue = previousDayTotalRepossessionsCases.length
      ? JSON.parse(previousDayTotalRepossessionsCases[0].count || 0)
      : 0;
    let totalRepossessionsValues = {
      value: totalRepossessedValue,
      previousValue: totalRepossessedPreviousValue,
    };
    if (totalRepossessedValue === 0 && totalRepossessedPreviousValue === 0) {
      totalRepossessionsValues = {
        ...totalRepossessionsValues,
        percentage: 0,
      };
    } else if (totalRepossessedValue !== 0 && totalRepossessedPreviousValue === 0) {
      totalRepossessionsValues = {
        ...totalRepossessionsValues,
        percentage: 100,
      };
    } else {
      totalRepossessionsValues = {
        ...totalRepossessionsValues,
        percentage: Utils.calculatePercentage(totalRepossessedValue, totalRepossessedPreviousValue),
      };
    }
    return totalRepossessionsValues;
  };

  const getRepossessionHitListCount = async (dbName, replacements = {}, conditionalQuery = '') => {
    if (!dbName) {
      return;
    }

    const repossessionHitListCountSql = `
      SELECT
        count(*) as count
      FROM
        cases
      INNER JOIN
        users
      ON
        cases.spotter_id=users.id
      WHERE
        cases.spotted_date IS NOT NULL AND
        cases.status in (:statuses) ${conditionalQuery}
      ORDER BY
        cases.spotted_date
    `;

    const totalRepossessionHitListCountList = await db[`${dbName}_sequelize`].query(repossessionHitListCountSql, {
      replacements: {
        statuses: [CASE_STATUSES.open, CASE_STATUSES.need_info],
        ...replacements,
      },
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    return totalRepossessionHitListCountList.length ? totalRepossessionHitListCountList[0].count || 0 : 0;
  };

  const getConfirmedNotRepossessedCounts = async (
    company,
    branchId,
    user,
    currentDayDateRange,
    previousDayDateRange,
    // timezoneOffset
  ) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);
    const conditionalQuery = `
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      AND 
      spotted_date <= :end
    `;

    const replacements = {
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    const currentDayreplacements = {
      ...replacements,
      end: moment(currentDayDateRange.end) // 9 am of local of next day
        .tz(serverTime.timezone, true)
        .set({ hours: SPOTTED_FROM_TIME })
        .utc()
        // .add(1, 'days')
        .format('YYYY-MM-DD HH:mm:ss'),
    };

    const previousDayreplacements = {
      ...replacements,
      end: moment(previousDayDateRange.end) // 9 am of local of next day
        .tz(serverTime.timezone, true)
        .set({ hours: SPOTTED_TO_TIME })
        .utc()
        // .add(1, 'days')
        .format('YYYY-MM-DD HH:mm:ss'),
    };

    let [totalConfirmNotRepossessedValue, totalConfirmNotRepossessedPreviousValue] = await Promise.all([
      getRepossessionHitListCount(company.dbName, currentDayreplacements, conditionalQuery),
      getRepossessionHitListCount(company.dbName, previousDayreplacements, conditionalQuery),
    ]);

    let totalConfirmNotRepossessionsValues = {
      value: totalConfirmNotRepossessedValue,
      previousValue: totalConfirmNotRepossessedPreviousValue,
    };
    if (totalConfirmNotRepossessedValue === 0 && totalConfirmNotRepossessedPreviousValue === 0) {
      totalConfirmNotRepossessionsValues = {
        ...totalConfirmNotRepossessionsValues,
        percentage: 0,
      };
    } else if (totalConfirmNotRepossessedValue !== 0 && totalConfirmNotRepossessedPreviousValue === 0) {
      totalConfirmNotRepossessionsValues = {
        ...totalConfirmNotRepossessionsValues,
        percentage: 100,
      };
    } else {
      totalConfirmNotRepossessionsValues = {
        ...totalConfirmNotRepossessionsValues,
        percentage: Utils.calculatePercentage(
          totalConfirmNotRepossessedValue,
          totalConfirmNotRepossessedPreviousValue,
        ),
      };
    }
    return totalConfirmNotRepossessionsValues;
  };

  // const getConfirmedNotRepossessedCounts = async (
  //   company,
  //   branchId,
  //   currentDayDateRange,
  //   previousDayDateRange,
  //   timezoneOffset
  // ) => {
  //   const { Branch } = require("../database/models")[company.dbName];
  //   let branch;
  //   let vendorBranchNames = [];
  //   if (branchId !== COMPANY_WIDE_BRANCH_ID && branchId !== UNKNOWN_BRANCH_ID) {
  //     branch = await Branch.findOne({
  //       where: {
  //         id: branchId
  //       }
  //     });
  //     if (!branch) {
  //       const err = {
  //         status: httpStatus.FORBIDDEN,
  //         message: messageConstants.INVALID_BRANCH_ID
  //       };
  //       throw new APIError(err);
  //     }
  //     vendorBranchNames = Utils.getBranches(company.dbName)[branch.name] || [
  //       ""
  //     ];
  //   }

  //   const confirmedNotRepossessedQuery = `
  //     SELECT
  //       count(confirmedNotRepossessedResult.case_id) as count
  //     FROM
  //     (
  //       SELECT
  //         c.case_id,
  //         currentShiftTimes.*
  //       FROM
  //         (
  //           SELECT
  //             st.id as shiftTimeId,
  //             st.user_id,
  //             st.start_time,
  //             st.end_time,
  //             st.shift_period_start_time,
  //             st.shift_period_end_time
  //           FROM
  //             shift_times st
  //           WHERE
  //             st.start_time >=:currentStartTime AND
  //             (
  //               st.end_time <=:currentEndTime
  //                 OR
  //               st.end_time is null
  //             )
  //         ) as currentShiftTimes,
  //         cases c
  //       WHERE
  //         c.spotter_id=currentShiftTimes.user_id AND
  //         c.spotted_date >= currentShiftTimes.start_time AND
  //         c.spotted_date <=
  //         IF(
  //           currentShiftTimes.end_time is null,
  //           currentShiftTimes.shift_period_end_time,
  //           currentShiftTimes.end_time
  //         ) AND
  //         c.rdn_repo_date is null
  //         ${
  //           branchId !== COMPANY_WIDE_BRANCH_ID &&
  //           branchId !== UNKNOWN_BRANCH_ID
  //             ? `AND vendor_branch_name in (:vendorBranchNames)`
  //             : ``
  //         }
  //         ${
  //           branchId === UNKNOWN_BRANCH_ID
  //             ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
  //             : ``
  //         }
  //       ) as confirmedNotRepossessedResult`;

  //   let [
  //     confirmedNotRepossessedCases,
  //     previousDayConfirmedNotRepossessedCases
  //   ] = await Promise.all([
  //     db[`${company.dbName}_sequelize`].query(confirmedNotRepossessedQuery, {
  //       replacements: {
  //         currentStartTime: moment(currentDayDateRange.start)
  //           .startOf("day")
  //           .add(timezoneOffset, "hours")
  //           .format(),
  //         currentEndTime: moment(currentDayDateRange.end)
  //           .endOf("day")
  //           .add(timezoneOffset, "hours")
  //           .format(),
  //         vendorBranchNames: vendorBranchNames.length
  //           ? vendorBranchNames
  //           : [""],
  //         subBranches: Utils.__SUB_BRANCHES__[company.dbName]
  //       },
  //       type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT
  //     }),
  //     db[`${company.dbName}_sequelize`].query(confirmedNotRepossessedQuery, {
  //       replacements: {
  //         currentStartTime: moment(previousDayDateRange.start)
  //           .startOf("day")
  //           .add(timezoneOffset, "hours")
  //           .format(),
  //         currentEndTime: moment(previousDayDateRange.end)
  //           .endOf("day")
  //           .add(timezoneOffset, "hours")
  //           .format(),
  //         vendorBranchNames: vendorBranchNames.length
  //           ? vendorBranchNames
  //           : [""],
  //         subBranches: Utils.__SUB_BRANCHES__[company.dbName]
  //       },
  //       type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT
  //     })
  //   ]);

  //   let totalConfirmedNotRepossessedValue = confirmedNotRepossessedCases.length
  //     ? JSON.parse(confirmedNotRepossessedCases[0].count)
  //     : 0;
  //   let totalConfirmedNotRepossessedPreviousValue = previousDayConfirmedNotRepossessedCases.length
  //     ? JSON.parse(previousDayConfirmedNotRepossessedCases[0].count)
  //     : 0;
  //   let totalConfirmedNotRepossessedValues = {
  //     value: totalConfirmedNotRepossessedValue,
  //     previousValue: totalConfirmedNotRepossessedPreviousValue
  //   };
  //   if (
  //     totalConfirmedNotRepossessedValue === 0 &&
  //     totalConfirmedNotRepossessedPreviousValue === 0
  //   ) {
  //     totalConfirmedNotRepossessedValues = {
  //       ...totalConfirmedNotRepossessedValues,
  //       percentage: 0
  //     };
  //   } else if (
  //     totalConfirmedNotRepossessedValue !== 0 &&
  //     totalConfirmedNotRepossessedPreviousValue === 0
  //   ) {
  //     totalConfirmedNotRepossessedValues = {
  //       ...totalConfirmedNotRepossessedValues,
  //       percentage: 100
  //     };
  //   } else {
  //     totalConfirmedNotRepossessedValues = {
  //       ...totalConfirmedNotRepossessedValues,
  //       percentage: Utils.calculatePercentage(
  //         totalConfirmedNotRepossessedValue,
  //         totalConfirmedNotRepossessedPreviousValue
  //       )
  //     };
  //   }

  //   return totalConfirmedNotRepossessedValues;
  // };

  const getSpottedCounts = async (
    company,
    branchId,
    user,
    currentDayDateRange,
    previousDayDateRange,
    // timezoneOffset
  ) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const spottedQuery = ` SELECT 
        IF(
          (count is null),
          0,
          SUM(count)
        ) as count
      FROM
      (
        SELECT
          count(*) as count, spotted_branch_id
        FROM
          cases
        WHERE
          spotted_date >=:start AND
          spotted_date <=:end
          ${
            (branchId !== COMPANY_WIDE_BRANCH_ID &&
              branchId !== UNKNOWN_BRANCH_ID &&
              user.role.role === SUPER_ADMIN_ROLE) ||
            user.role.role !== SUPER_ADMIN_ROLE
              ? `AND spotted_branch_id in (:spottedBranchIds)`
              : ``
          }
          ${
            branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
              ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
              : ``
          }
        GROUP BY
          spotted_branch_id
      ) as spottedCountByBranch
    `;

    let [totalSpottedCases, previousDayTotalSpottedCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(spottedQuery, {
        replacements: {
          start: moment(currentDayDateRange.start) // 9:01 am local
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(currentDayDateRange.end) // 9 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
          subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(spottedQuery, {
        replacements: {
          start: moment(previousDayDateRange.start)
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(previousDayDateRange.end)
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
          subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let totalSpottedValue = totalSpottedCases.length ? JSON.parse(totalSpottedCases[0].count || 0) : 0;
    let totalSpottedPreviousValue = previousDayTotalSpottedCases.length
      ? JSON.parse(previousDayTotalSpottedCases[0].count || 0)
      : 0;
    let totalSpottedValues = {
      value: totalSpottedValue,
      previousValue: totalSpottedPreviousValue,
    };
    if (totalSpottedValue === 0 && totalSpottedPreviousValue === 0) {
      totalSpottedValues = {
        ...totalSpottedValues,
        percentage: 0,
      };
    } else if (totalSpottedValue !== 0 && totalSpottedPreviousValue === 0) {
      totalSpottedValues = {
        ...totalSpottedValues,
        percentage: 100,
      };
    } else {
      totalSpottedValues = {
        ...totalSpottedValues,
        percentage: Utils.calculatePercentage(totalSpottedValue, totalSpottedPreviousValue),
      };
    }

    return totalSpottedValues;
  };

  const getSpottedNotSecuredCounts = async (
    company,
    branchId,
    user,
    currentDayDateRange,
    previousDayDateRange,
    // timezoneOffset
  ) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const spottedNotSecuredQuery = ` SELECT 
        IF(
          (spottedNotSecuredCountByBranch.count is null),
          0,
          SUM(spottedNotSecuredCountByBranch.count)
        ) as count
      FROM
      (
        SELECT
          count(*) as count, spotted_branch_id
        FROM
          cases
        WHERE
          status not in (:status) AND
          spotted_date >=:start AND
          spotted_date <=:end
          ${
            (branchId !== COMPANY_WIDE_BRANCH_ID &&
              branchId !== UNKNOWN_BRANCH_ID &&
              user.role.role === SUPER_ADMIN_ROLE) ||
            user.role.role !== SUPER_ADMIN_ROLE
              ? `AND spotted_branch_id in (:spottedBranchIds)`
              : ``
          }
          ${
            branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
              ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
              : ``
          }
        GROUP BY
          spotted_branch_id
      ) as spottedNotSecuredCountByBranch
    `;

    let [totalSpottedNotSecuredCases, previousDayTotalSpottedNotSecuredCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(spottedNotSecuredQuery, {
        replacements: {
          start: moment(currentDayDateRange.start) // 9:01 am local
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_NOT_SECURED_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(currentDayDateRange.end) // 9 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_NOT_SECURED_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          status: [CASE_STATUSES.repossessed],
          spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
          subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(spottedNotSecuredQuery, {
        replacements: {
          start: moment(previousDayDateRange.start) // 9:01 am local
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_NOT_SECURED_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(previousDayDateRange.end) // 9 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: SPOTTED_NOT_SECURED_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          status: [CASE_STATUSES.repossessed],
          spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
          subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let totalSpottedNotSecuredValue = totalSpottedNotSecuredCases.length
      ? JSON.parse(totalSpottedNotSecuredCases[0].count || 0)
      : 0;
    let totalSpottedNotSecuredPreviousValue = previousDayTotalSpottedNotSecuredCases.length
      ? JSON.parse(previousDayTotalSpottedNotSecuredCases[0].count || 0)
      : 0;
    let totalSpottedNotSecuredValues = {
      value: totalSpottedNotSecuredValue,
      previousValue: totalSpottedNotSecuredPreviousValue,
    };
    if (totalSpottedNotSecuredValue === 0 && totalSpottedNotSecuredPreviousValue === 0) {
      totalSpottedNotSecuredValues = {
        ...totalSpottedNotSecuredValues,
        percentage: 0,
      };
    } else if (totalSpottedNotSecuredValue !== 0 && totalSpottedNotSecuredPreviousValue === 0) {
      totalSpottedNotSecuredValues = {
        ...totalSpottedNotSecuredValues,
        percentage: 100,
      };
    } else {
      totalSpottedNotSecuredValues = {
        ...totalSpottedNotSecuredValues,
        percentage: Utils.calculatePercentage(totalSpottedNotSecuredValue, totalSpottedNotSecuredPreviousValue),
      };
    }

    return totalSpottedNotSecuredValues;
  };

  const getCameraScansCounts = async (company, branchId, user, currentDate, previousDate) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }

    const cameraScansQuery = `
      SELECT
        sum(cs.count) as count,
        b.name as vendorBranchName
      FROM
        camera_scans cs
      INNER JOIN 
        users u 
      ON 
        cs.drn_id=u.drn_id
      INNER JOIN 
        branches b 
      ON 
        b.id=u.branch_id
      WHERE
        cs.scanned_at =:scannedAt
        ${
          ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
            user.role.role !== SUPER_ADMIN_ROLE) &&
          branchId !== UNKNOWN_BRANCH_ID
            ? `AND b.id=:branchId`
            : ``
        }
        ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
    `;

    let [cameraScans, previousDayCameraScans] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraScansQuery, {
        replacements: {
          scannedAt: currentDate,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraScansQuery, {
        replacements: {
          scannedAt: previousDate,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);
    let cameraScansByBranchValue = cameraScans.length ? JSON.parse(cameraScans[0].count || 0) : 0;
    let cameraScansByBranchPreviousValue = previousDayCameraScans.length
      ? JSON.parse(previousDayCameraScans[0].count || 0)
      : 0;
    let cameraScansValues = {
      value: cameraScansByBranchValue,
      previousValue: cameraScansByBranchPreviousValue,
    };
    if (cameraScansByBranchValue === 0 && cameraScansByBranchPreviousValue === 0) {
      cameraScansValues = {
        ...cameraScansValues,
        percentage: 0,
      };
    } else if (cameraScansByBranchValue !== 0 && cameraScansByBranchPreviousValue === 0) {
      cameraScansValues = {
        ...cameraScansValues,
        percentage: 100,
      };
    } else {
      cameraScansValues = {
        ...cameraScansValues,
        percentage: Utils.calculatePercentage(cameraScansByBranchValue, cameraScansByBranchPreviousValue),
      };
    }

    return cameraScansValues;
  };
  const getCameraHitsCounts = async (company, branchId, user, currentDate, previousDate) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }

    const cameraHitsQuery = `
      SELECT
        sum(ch.count) as count,
        b.name as vendorBranchName
      FROM
      camera_hits ch
      INNER JOIN 
        users u 
      ON 
        ch.drn_id=u.drn_id
      INNER JOIN 
        branches b 
      ON 
        b.id=u.branch_id
      WHERE
        ch.scanned_at =:scannedAt
        ${
          ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
            user.role.role !== SUPER_ADMIN_ROLE) &&
          branchId !== UNKNOWN_BRANCH_ID
            ? `AND b.id=:branchId`
            : ``
        }
        ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
    `;

    let [cameraHits, previousDayCameraHits] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          scannedAt: currentDate,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          scannedAt: previousDate,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let cameraHitsByBranchValue = cameraHits.length ? JSON.parse(cameraHits[0].count || 0) : 0;
    let cameraHitsByBranchPreviousValue = previousDayCameraHits.length
      ? JSON.parse(previousDayCameraHits[0].count || 0)
      : 0;
    let cameraHitsValues = {
      value: cameraHitsByBranchValue,
      previousValue: cameraHitsByBranchPreviousValue,
    };
    if (cameraHitsByBranchValue === 0 && cameraHitsByBranchPreviousValue === 0) {
      cameraHitsValues = {
        ...cameraHitsValues,
        percentage: 0,
      };
    } else if (cameraHitsByBranchValue !== 0 && cameraHitsByBranchPreviousValue === 0) {
      cameraHitsValues = {
        ...cameraHitsValues,
        percentage: 100,
      };
    } else {
      cameraHitsValues = {
        ...cameraHitsValues,
        percentage: Utils.calculatePercentage(cameraHitsByBranchValue, cameraHitsByBranchPreviousValue),
      };
    }

    return cameraHitsValues;
  };
  const getCameraHitsNotSecuredCounts = async (company, branchId, user, currentDate, previousDate) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }
    const cameraHitsQuery = `
    SELECT ch.direct,b.name as vendorBranchName,ch.direct_hits_vins
      FROM
      camera_hits ch
      INNER JOIN 
        users u 
      ON 
        ch.drn_id=u.drn_id
      INNER JOIN 
        branches b 
      ON 
        b.id=u.branch_id
      WHERE ch.scanned_at =:scannedAt AND
      ch.direct_hits_vins IS NOT NULL
      ${
        ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE) &&
        branchId !== UNKNOWN_BRANCH_ID
          ? `AND b.id=:branchId`
          : ``
      }
      ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
  `;

    let [cameraHits, previousDayCameraHits] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          scannedAt: currentDate,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          scannedAt: previousDate,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let cameraHitsVin = [];
    cameraHits.map((item) => {
      const directHitVins = JSON.parse(item.direct_hits_vins);
      directHitVins.map((directHitVin) => {
        cameraHitsVin.push(directHitVin);
      });
    });
    let previousDayCameraHitsVin = [];
    previousDayCameraHits.map((item) => {
      const directHitVins = JSON.parse(item.direct_hits_vins);
      directHitVins.map((directHitVin) => {
        previousDayCameraHitsVin.push(directHitVin);
      });
    });
    const cameraHitsVinCount =
      cameraHitsVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select * from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:cameraHitsVin) and status != '${CASE_STATUSES.repossessed}'`,
            {
              replacements: {
                cameraHitsVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const previousDayCameraHitsVinCount =
      previousDayCameraHitsVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select * from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:previousDayCameraHitsVin) and status != '${CASE_STATUSES.repossessed}'`,
            {
              replacements: {
                previousDayCameraHitsVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    let cameraHitsByBranchValue = cameraHitsVinCount.length ? cameraHitsVinCount.length || 0 : 0;
    let cameraHitsByBranchPreviousValue = previousDayCameraHitsVinCount.length
      ? previousDayCameraHitsVinCount.length || 0
      : 0;
    let cameraHitsNotSecuredValues = {
      value: cameraHitsByBranchValue,
      previousValue: cameraHitsByBranchPreviousValue,
    };
    if (cameraHitsByBranchValue === 0 && cameraHitsByBranchPreviousValue === 0) {
      cameraHitsNotSecuredValues = {
        ...cameraHitsNotSecuredValues,
        percentage: 0,
      };
    } else if (cameraHitsByBranchValue !== 0 && cameraHitsByBranchPreviousValue === 0) {
      cameraHitsNotSecuredValues = {
        ...cameraHitsNotSecuredValues,
        percentage: 100,
      };
    } else {
      cameraHitsNotSecuredValues = {
        ...cameraHitsNotSecuredValues,
        percentage: Utils.calculatePercentage(cameraHitsByBranchValue, cameraHitsByBranchPreviousValue),
      };
    }

    return cameraHitsNotSecuredValues;
  };

  const getAccountNotCheckedCounts = async (
    company,
    branchId,
    user,
    currentDayDateRange,
    previousDayDateRange,
  ) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    const vendorBranchNames = await getMainBranches(company, user, branchId);

    // new query
    const assignedCasesWithoutCheckedInCasesSql = `
      SELECT c.case_id FROM cases c
      WHERE
      status in (:status) AND
      order_date >=:start AND
      order_date <=:end AND
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `vendor_branch_name in (:vendorBranchNames) AND`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `(vendor_branch_name is null OR vendor_branch_name not in (:subBranches)) AND`
          : ``
      }
      NOT EXISTS (SELECT ua.case_id FROM user_activities ua WHERE c.case_id = ua.case_id AND ua.updated_type in (:agentUpdateTypes))
      `;

    let [currentCases, previousCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(assignedCasesWithoutCheckedInCasesSql, {
        replacements: {
          start: moment(currentDayDateRange.start) // 9:01 am local
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(currentDayDateRange.end) // 9 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          status: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(assignedCasesWithoutCheckedInCasesSql, {
        replacements: {
          start: moment(previousDayDateRange.start) // 12:00 am local
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(previousDayDateRange.end) // 11:59 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          status: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let accountNotCheckedValues = {
      value: currentCases.length,
      previousValue: previousCases.length,
    };

    if (currentCases.length === 0 && previousCases.length === 0) {
      accountNotCheckedValues = {
        ...accountNotCheckedValues,
        percentage: 0,
      };
    } else if (currentCases.length !== 0 && previousCases.length === 0) {
      accountNotCheckedValues = {
        ...accountNotCheckedValues,
        percentage: 100,
      };
    } else {
      accountNotCheckedValues = {
        ...accountNotCheckedValues,
        percentage: Utils.calculatePercentage(currentCases.length, previousCases.length),
      };
    }

    return accountNotCheckedValues;
  };

  const getCheckInsCounts = async (company, branchId, user, currentDayDateRange, previousDayDateRange) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    // TODO: Replace this method
    const vendorBranchNames = await getMainBranches(company, user, branchId);

    const assignedCasesWithCheckedInsCasesSql = `
      SELECT c.case_id, COUNT(c.case_id) as total
      FROM cases c
      LEFT JOIN user_activities ua ON c.case_id = ua.case_id
      WHERE
        status in (:status) AND
        order_date >=:start AND
        order_date <=:end AND
        ua.updated_type in (:agentUpdateTypes)
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND vendor_branch_name in (:vendorBranchNames)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
            : ``
        }
      ORDER BY c.case_id
    `;

    let [currentCases, previousCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(assignedCasesWithCheckedInsCasesSql, {
        replacements: {
          start: moment(currentDayDateRange.start) // 9:01 am local
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(currentDayDateRange.end) // 9 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          status: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(assignedCasesWithCheckedInsCasesSql, {
        replacements: {
          start: moment(previousDayDateRange.start) // 12:00 am local
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(previousDayDateRange.end) // 11:59 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
          status: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let checkInsValues = {
      value: currentCases[0].total,
      previousValue: previousCases[0].total,
    };

    if (currentCases[0].total === 0 && previousCases[0].total === 0) {
      checkInsValues = {
        ...checkInsValues,
        percentage: 0,
      };
    } else if (currentCases[0].total !== 0 && previousCases[0].total === 0) {
      checkInsValues = {
        ...checkInsValues,
        percentage: 100,
      };
    } else {
      checkInsValues = {
        ...checkInsValues,
        percentage: Utils.calculatePercentage(currentCases[0].total, previousCases[0].total),
      };
    }

    return checkInsValues;
  };

  const getRecoveryRatesForDailyReports = async (company, user, currentDayDateRange) => {
    const serverTime = await systemService().getServerTime(company.dbName);

    const vendorBranchNames = await getMainBranches(company, user, COMPANY_WIDE_BRANCH_ID);

    const { Case } = await companyService().getCompanyDatabase(company.dbName);

    // DEPRECATED
    // const hoursAddedToAssignmentStartDate =
    //   ASSIGNMENT_FROM_TIME + -RDN_SERVER_TIME_ZONE_OFFSET;
    // const hoursAddedToAssignmentEndDate =
    //   ASSIGNMENT_TO_TIME + -RDN_SERVER_TIME_ZONE_OFFSET;

    const newAssignedCasesForAllBranches = await Case.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: values(CASE_STATUSES),
        },
        orderDate: {
          [Sequelize.Op.gte]: moment(currentDayDateRange.start) // 12:00 am local
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_FROM_TIME })
            .utc()
            .format(),
          [Sequelize.Op.lte]: moment(currentDayDateRange.end) // 11:59 am of local of next day
            .tz(serverTime.timezone, true)
            .set({ hours: ASSIGNMENT_TO_TIME })
            .utc()
            .add(1, 'days')
            .format(),
        },
        ...(vendorBranchNames.length && {
          vendorBranchName: {
            [Sequelize.Op.in]: vendorBranchNames,
          },
        }),
      },
      raw: true,
    });

    const newAssignedForAllBranches = groupBy(newAssignedCasesForAllBranches, (a) =>
      Utils.convertBranch(a.vendorBranchName, company.dbName),
    );
    let recoverRates = [];
    const BRANCH_NAMES = Utils.getMainBranches(company.dbName);
    for (const [key] of Object.entries(BRANCH_NAMES)) {
      const branchName = BRANCH_NAMES[key];
      if (branchName !== COMPANY_WIDE) {
        if (
          !newAssignedForAllBranches[branchName] ||
          (newAssignedForAllBranches[branchName] && !newAssignedForAllBranches[branchName].length)
        ) {
          recoverRates.push({
            branchName,
            value: 0,
          });
        } else {
          const totalRepossessionsForCurrentBranch = newAssignedForAllBranches[branchName].filter(
            (newAssignment) => {
              return newAssignment.status === CASE_STATUSES.repossessed;
            },
          );
          recoverRates.push({
            branchName,
            value: Utils.getRound(
              (100 * totalRepossessionsForCurrentBranch.length) / newAssignedForAllBranches[branchName].length,
            ),
          });
        }
      }
    }

    recoverRates = orderBy(recoverRates, 'value', 'desc');
    return recoverRates;
  };

  const getUnitsPendingRepossessions = async (startDate, endDate, company) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    const attributes = [[Sequelize.fn('count', Sequelize.col('case_id')), 'count']];
    if (startDate && endDate) attributes.push('vendorBranchName');
    const unitsPendingRepossessions = await Case.findAll({
      attributes,
      where: {
        status: {
          [Sequelize.Op.in]: [CASE_STATUSES.open, CASE_STATUSES.need_info],
        },
        spotterId: {
          [Sequelize.Op.ne]: null,
        },
        ...(startDate &&
          endDate && {
            spottedDate: {
              [Sequelize.Op.gte]: startDate,
              [Sequelize.Op.lte]: endDate,
            },
          }),
      },
      raw: true,
    });

    let confirmedNotRepossessed;
    if (startDate && endDate) {
      confirmedNotRepossessed = Utils.groupByBranch(unitsPendingRepossessions, company.dbName);
      confirmedNotRepossessed['Company Wide'] = sum(values(confirmedNotRepossessed));
    } else {
      confirmedNotRepossessed = unitsPendingRepossessions ? unitsPendingRepossessions[0].count : 0;
    }

    return confirmedNotRepossessed;
  };

  // const getTotalSpottedVehicles = async (
  //   dateStart,
  //   dateEnd,
  //   timezoneOffset,
  //   company
  // ) => {
  //   const { Case } = require("../database/models")[company.dbName];
  //   const spottedVehicles = await Case.findAll({
  //     attributes: [[Sequelize.fn("count", Sequelize.col("case_id")), "count"]],
  //     where: {
  //       status: {
  //         [Sequelize.Op.in]: [
  //           CASE_STATUSES.open,
  //           CASE_STATUSES.need_info,
  //           CASE_STATUSES.repossessed
  //         ]
  //       },
  //       spotterId: {
  //         [Sequelize.Op.ne]: null
  //       },
  //       spottedDate: {
  //         [Sequelize.Op.gte]: moment(`${dateStart} 00:09:00`)
  //           .add(timezoneOffset, "hours")
  //           .format(),
  //         [Sequelize.Op.lte]: moment(`${dateEnd} 00:09:00`)
  //           .add(timezoneOffset, "hours")
  //           .format()
  //       }
  //     },
  //     raw: true
  //   });

  //   return spottedVehicles ? spottedVehicles[0].count : 0;
  // };

  // const getSpottedNotSecured = async (
  //   dateStart,
  //   dateEnd,
  //   timezoneOffset,
  //   company
  // ) => {
  //   const { Case } = require("../database/models")[company.dbName];
  //   const spottedVehicles = await Case.findAll({
  //     attributes: [[Sequelize.fn("count", Sequelize.col("case_id")), "count"]],
  //     where: {
  //       status: {
  //         [Sequelize.Op.in]: [CASE_STATUSES.open, CASE_STATUSES.need_info]
  //       },
  //       spotterId: {
  //         [Sequelize.Op.ne]: null
  //       },
  //       spottedDate: {
  //         [Sequelize.Op.gte]: moment(`${dateStart} 00:09:00`)
  //           .add(timezoneOffset, "hours")
  //           .format(),
  //         [Sequelize.Op.lte]: moment(`${dateEnd} 00:09:00`)
  //           .add(timezoneOffset, "hours")
  //           .format()
  //       }
  //     },
  //     raw: true
  //   });

  //   return spottedVehicles ? spottedVehicles[0].count : 0;
  // };

  const getTotalRepossessionsMap = async (company, serverTimezone, dateRange) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);

    const cases = await Case.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
        },
        rdnRepoDate: {
          [Sequelize.Op.gte]: moment(dateRange.start)
            .tz(serverTimezone, true)
            .set({ hours: REPOSSESSIONS_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          [Sequelize.Op.lte]: moment(dateRange.end)
            .tz(serverTimezone, true)
            .set({ hours: REPOSSESSIONS_TO_TIME })
            .utc()
            .add(1, 'day')
            .format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      raw: true,
    });

    const points = cases
      .filter((c) => c.repoLat && c.repoLng)
      .map((c) => ({
        lat: c.repoLat,
        lng: c.repoLng,
        isVoluntary: VOLUNTARY_ORDER_TYPES.includes(c.orderType),
      }));

    const folder = `${company.dbName}`;
    const subfolder = `${moment().tz(serverTimezone).format('YYYY-MM-DD')}`;
    const filename = `1-total_repossessions`;

    const path = `${folder}/${subfolder}/${filename}`;

    const url = await mapService().createAndSaveMap(points, path);

    return url;
  };

  const getSpottedMap = async (company, serverTimezone, dateRange) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);

    const cases = await Case.findAll({
      where: {
        spottedDate: {
          [Sequelize.Op.not]: null,
          [Sequelize.Op.gte]: moment(dateRange.start)
            .tz(serverTimezone, true)
            .set({ hours: SPOTTED_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          [Sequelize.Op.lte]: moment(dateRange.end)
            .tz(serverTimezone, true)
            .set({ hours: SPOTTED_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      raw: true,
    });

    const points = cases
      .filter((c) => c.spottedLat && c.spottedLng)
      .map((c) => ({
        lat: c.spottedLat,
        lng: c.spottedLng,
        isVoluntary: VOLUNTARY_ORDER_TYPES.includes(c.orderType),
      }));

    const folder = `${company.dbName}`;
    const subfolder = `${moment().tz(serverTimezone).format('YYYY-MM-DD')}`;
    const filename = `2-spotted`;

    const path = `${folder}/${subfolder}/${filename}`;

    const url = await mapService().createAndSaveMap(points, path);

    return url;
  };

  const getSpottedNotSecuredMap = async (company, serverTimezone, dateRange) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);

    const cases = await Case.findAll({
      where: {
        status: {
          [Sequelize.Op.notIn]: [CASE_STATUSES.repossessed],
        },
        spottedDate: {
          [Sequelize.Op.not]: null,
          [Sequelize.Op.gte]: moment(dateRange.start)
            .tz(serverTimezone, true)
            .set({ hours: SPOTTED_NOT_SECURED_FROM_TIME })
            .utc()
            .format('YYYY-MM-DD HH:mm:ss'),
          [Sequelize.Op.lte]: moment(dateRange.end)
            .tz(serverTimezone, true)
            .set({ hours: SPOTTED_NOT_SECURED_TO_TIME })
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD HH:mm:ss'),
        },
      },
      raw: true,
    });

    const points = cases
      .filter((c) => c.spottedLat && c.spottedLng)
      .map((c) => ({
        lat: c.spottedLat,
        lng: c.spottedLng,
        isVoluntary: VOLUNTARY_ORDER_TYPES.includes(c.orderType),
      }));

    const folder = `${company.dbName}`;
    const subfolder = `${moment().tz(serverTimezone).format('YYYY-MM-DD')}`;
    const filename = `3-spotted_not_secured`;

    const path = `${folder}/${subfolder}/${filename}`;

    const url = await mapService().createAndSaveMap(points, path);

    return url;
  };

  const sendDailyReportEmailToManagers = async (company) => {
    const { Role, User } = await companyService().getCompanyDatabase(company.dbName);
    const serverTimezone = await getServerTime(company.dbName);
    const offset = -moment().tz(serverTimezone).utcOffset() / 60;

    const currentDayDateRange = {
      start: moment().tz(serverTimezone).subtract(1, 'days').format('YYYY-MM-DD'),
      end: moment().tz(serverTimezone).subtract(1, 'days').format('YYYY-MM-DD'),
    };
    const previousDayDateRange = {
      start: moment().tz(serverTimezone).subtract(2, 'days').format('YYYY-MM-DD'),
      end: moment().tz(serverTimezone).subtract(2, 'days').format('YYYY-MM-DD'),
    };
    const mapDateRange = {
      start: moment().tz(serverTimezone).subtract(1, 'days').format('YYYY-MM-DD'),
      end: moment().tz(serverTimezone).subtract(1, 'days').format('YYYY-MM-DD'),
    };

    // Find the roles that correspond to the manager roles.
    const managerRoles = await Role.findAll({
      where: {
        type: {
          [Sequelize.Op.in]: MANAGER_ROLES,
        },
      },
    });

    // Find all users with manager roles (Super Admins, Branch Managers, Administrators).
    const managers = await User.findAll({
      where: {
        roleId: {
          [Sequelize.Op.in]: managerRoles.map((role) => role.id),
        },
        status: USER_STATUS.active,
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'type', 'role'],
        },
      ],
    });

    const totalRepossessionsMap = await getTotalRepossessionsMap(company, serverTimezone, mapDateRange);
    const spottedMap = await getSpottedMap(company, serverTimezone, mapDateRange, offset);
    const spottedNotSecuredMap = await getSpottedNotSecuredMap(company, serverTimezone, mapDateRange, offset);

    serverLogger.info(
      `Sending daily report for ${company.dbName} managers: ${managers.map(({ email }) => email)}`,
    );

    // Get all data pertaining to the manager for the daily report.
    for (let manager of managers) {
      try {
        const [
          newAssignments,
          totalRepossessions,
          confirmedNotRepossessed,
          spotted,
          spottedNotSecured,
          scans,
          liveHits,
          liveHitsNotSecured,
          accountNotChecked,
          checkIns,
          recoverRates,
        ] = await Promise.all([
          getNewAssignments(company, COMPANY_WIDE_BRANCH_ID, manager, currentDayDateRange, previousDayDateRange),
          getRepossessions(company, COMPANY_WIDE_BRANCH_ID, manager, currentDayDateRange, previousDayDateRange),
          getConfirmedNotRepossessedCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange,
            previousDayDateRange,
            offset,
          ),
          getSpottedCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange,
            previousDayDateRange,
            offset,
          ),
          getSpottedNotSecuredCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange,
            previousDayDateRange,
            offset,
          ),
          getCameraScansCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange.start,
            previousDayDateRange.start,
          ),
          getCameraHitsCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange.start,
            previousDayDateRange.start,
          ),
          getCameraHitsNotSecuredCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange.start,
            previousDayDateRange.start,
          ),
          getAccountNotCheckedCounts(
            company,
            COMPANY_WIDE_BRANCH_ID,
            manager,
            currentDayDateRange,
            previousDayDateRange,
          ),
          getCheckInsCounts(company, COMPANY_WIDE_BRANCH_ID, manager, currentDayDateRange, previousDayDateRange),
          getRecoveryRatesForDailyReports(company, manager, currentDayDateRange, previousDayDateRange),
        ]);

        // Configure the email.
        const mailConfig = await mailService().config({
          to: manager.email,
          subject: `Insightt Daily Report (${workerEnvironment})`,
          template: 'daily-report',
          templateOptions: {
            newAssignments,
            totalRepossessions,
            confirmedNotRepossessed,
            spotted,
            spottedNotSecured,
            scans,
            accountNotChecked,
            checkIns,
            recoverRates,
            liveHits,
            liveHitsNotSecured,
            detailsLink: `${emailDomain}/app/reports/daily-report`,
            totalRepossessionsMap,
            spottedMap,
            spottedNotSecuredMap,
          },
          emailReplyAddress: emailReplyAddress || company.emailReplyAddress,
        });

        // Send the daily report.
        await mailService().send(mailConfig);

        serverLogger.info(`===> Email sent to ${manager.email}`);
      } catch (e) {
        serverLogger.log({
          operationName: 'sendMailError',
          message: `===> Error on manager ${manager.email} when sent daily report: ${e}`,
          error: e,
          level: 'error',
        });
      }
    }
  };

  const getShiftAllowedTime = async (company, roleId, shiftObj, timeclocks) => {
    const { TimeClock } = await companyService().getCompanyDatabase(company.dbName);
    let allowedIdleTime = 0;
    if (shiftObj.shiftType === SHIFT_TYPES.normal_shift) {
      let motionTrackerForUserGroup;
      if (timeclocks && timeclocks[`${shiftObj.shiftId}_${roleId}`]) {
        motionTrackerForUserGroup = timeclocks[`${shiftObj.shiftId}_${roleId}`];
      }
      if (!motionTrackerForUserGroup) {
        motionTrackerForUserGroup = await TimeClock.findOne({
          where: {
            shiftId: shiftObj.shiftId,
            type: TIME_CLOCK_TYPES.motion_tracker,
            userGroupId: roleId,
          },
        });
        if (timeclocks) {
          timeclocks[`${shiftObj.shiftId}_${roleId}`] = motionTrackerForUserGroup;
        }
      }
      allowedIdleTime = motionTrackerForUserGroup ? motionTrackerForUserGroup.allowedTime : 0;
    } else {
      allowedIdleTime = MANUAL_TIME_MOTION_TRACKER_INTERVAL_MINUTES;
    }
    return {
      allowedIdleTime: allowedIdleTime,
      timeclocks: timeclocks,
    };
  };

  const getShiftStatistics = async (dbName, requestData) => {
    const { GeoLocation, BreakTime } = require('../database/models')[dbName];

    const shiftTimesSql = `
      SELECT st.id as shift_time_id, u.id as user_id, u.first_name, u.last_name, u.avatar_url FROM
        shift_times st, users u
      WHERE 
        st.shift_id = :shiftId AND
        st.start_time >= :start AND
        (st.end_time <= :end OR st.end_time is null) AND
        st.user_id = u.id 
      `;

    const shiftTimes = await db[`${dbName}_sequelize`].query(shiftTimesSql, {
      replacements: {
        start: moment(`${requestData.start} 00:00:00`).add(requestData.timezoneOffset, 'hours').format(),
        end: moment(`${requestData.end} 23:59:59`).add(requestData.timezoneOffset, 'hours').format(),
        shiftId: requestData.shiftId,
      },
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    const shiftTimeIds = shiftTimes.map((shiftTime) => shiftTime.shift_time_id);

    const geoLocations = await GeoLocation.findAll({
      where: {
        shiftTimeId: {
          [Sequelize.Op.in]: shiftTimeIds,
        },
      },
    });

    const breakTimes = await BreakTime.findAll({
      where: {
        shiftTimeId: {
          [Sequelize.Op.in]: shiftTimeIds,
        },
      },
    });

    const locations = [...geoLocations, ...breakTimes];

    const shiftStatistics = [];
    shiftTimes.map((shiftTime) => {
      const matchedLocations = locations.filter((location) => {
        return location.shiftTimeId === shiftTime.shift_time_id;
      });
      shiftStatistics.push({
        userId: shiftTime.user_id,
        firstName: shiftTime.first_name,
        lastName: shiftTime.last_name,
        avatarUrl: shiftTime.avatar_url,
        locations: matchedLocations,
      });
    });
    return shiftStatistics;
  };

  const getDriverReports = async (extraWhere, dateObj, reportType, company) => {
    const drive_time_by_shift_time_query = `
      SELECT
        st.id as shift_time_id,
        st.manual_count,
        concat(u.first_name, ' ', u.last_name) as employee_name,
        u.id as employee_id,
        u.role_id as role_id,
        u.avatar_url,
        last_geoLocations_record.id,
        last_geoLocations_record.end_track_time,
        st.start_time as start_shift,
        st.end_time as end_shift,
        st.user_device_type as device_type,
        st.shift_type,
        TIMESTAMPDIFF(SECOND, st.start_time, 
          IF
          (
            st.end_time is null,
            last_geoLocations_record.end_track_time,
            st.end_time
          )
        ) as time,
        IF(
          (total_break_times.break_time_diff is null),
          0,
          total_break_times.break_time_diff
        ) as break,
        IF(
          (total_pause_times.break_time_diff is null),
          0,
          total_pause_times.break_time_diff
        ) as pause,
        IF(
          (total_idle_break_times.break_time_diff is null),
          0,
          total_idle_break_times.break_time_diff
        ) as idle
      FROM
        shift_times st
      LEFT JOIN (
        SELECT  shift_time_id, (IF(
          SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) is null,
          0,
          SUM(TIMESTAMPDIFF(SECOND, start_time, end_time))
        )) as break_time_diff
        FROM break_times
        WHERE
          type=:break_type AND end_time is not NULL
        GROUP BY shift_time_id
      ) as total_break_times
      ON st.id = total_break_times.shift_time_id
      LEFT JOIN (
        SELECT  shift_time_id, (IF(
          SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) is null,
          0,
          SUM(TIMESTAMPDIFF(SECOND, start_time, end_time))
        )) as break_time_diff
        FROM break_times
        WHERE
          type=:pause_type AND end_time is not NULL
        GROUP BY shift_time_id
      ) as total_pause_times
      ON st.id = total_pause_times.shift_time_id
      LEFT JOIN (
        SELECT  shift_time_id, (IF(
          SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) is null,
          0,
          SUM(TIMESTAMPDIFF(SECOND, start_time, end_time))
        )) as break_time_diff
        FROM break_times
        WHERE
          type=:idle_type AND end_time is not NULL
        GROUP BY shift_time_id
      ) as total_idle_break_times
      ON st.id = total_idle_break_times.shift_time_id
      LEFT JOIN (
        SELECT *
          FROM geo_locations
          WHERE id IN (
              SELECT MAX(id)
              FROM geo_locations
              GROUP BY shift_time_id
          )
      ) as last_geoLocations_record
      ON st.id = last_geoLocations_record.shift_time_id,
        users as u,
        branches as b
      WHERE
        st.user_id=u.id AND
        b.id=u.branch_id AND 
        st.start_time>=:start AND
        st.start_time<=:end ${extraWhere || ''}
      GROUP BY
        st.id
      ORDER BY st.id DESC
      `;

    const branch_result = await db[`${company.dbName}_sequelize`].query(drive_time_by_shift_time_query, {
      replacements: {
        start: moment(`${dateObj.start} 00:00:00`).add(dateObj.timezoneOffset, 'hours').format(),
        end: moment(`${dateObj.end} 23:59:59`).add(dateObj.timezoneOffset, 'hours').format(),
        break_type: BREAK_TIME_TYPES.break,
        pause_type: BREAK_TIME_TYPES.pause,
        idle_type: BREAK_TIME_TYPES.idle,
      },
      type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
    });

    const shift_time_ids = map(branch_result, 'shift_time_id');

    if (shift_time_ids.length) {
      let break_times = [];
      if (reportType === DAILY) {
        const sql2 = `
          SELECT id, shift_time_id, type, start_time, end_time,
            TIMESTAMPDIFF(SECOND, start_time, end_time) AS timediff
          FROM break_times
          WHERE shift_time_id IN (:shift_time_ids) AND end_time is not NULL AND
          type IN(:breakTypes)
          ORDER BY created_at ASC
        `;

        break_times = await db[`${company.dbName}_sequelize`].query(sql2, {
          replacements: {
            shift_time_ids: shift_time_ids.length ? shift_time_ids : [''],
            breakTypes: [BREAK_TIME_TYPES.break, BREAK_TIME_TYPES.pause],
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        });
      }

      if (branch_result.length) {
        await Promise.all(
          map(branch_result, async (item) => {
            let breaks,
              pauses = [];

            if (reportType === DAILY) {
              breaks = filter(break_times, {
                type: BREAK_TIME_TYPES.break,
                shift_time_id: item.shift_time_id,
              });
              pauses = filter(break_times, {
                type: BREAK_TIME_TYPES.pause,
                shift_time_id: item.shift_time_id,
              });
              item.breaks = breaks;
              item.pauses = pauses;
            }

            if (reportType !== DAILY) {
              item['total_seconds'] = +item.time;
              item['break_total'] = +item.break;
              item['pause_total'] = +item.pause;
              item['idle_total'] = +item.idle;

              item['total_seconds'] -= Math.abs(item['break_total'] - item['pause_total'] - +item.manual_count);

              if (item['total_seconds'] < 0) {
                item['total_seconds'] = 0;
              }
              item['driving_total'] = item['total_seconds'];
            } else {
              item['break_total_seconds'] = +item.break;
              item['pause_total_seconds'] = +item.pause;
              item['idle_total_seconds'] = +item.idle;

              item['total_seconds'] = Math.abs(+item.time - +item.manual_count);

              item['driving_total_seconds'] = Math.abs(
                item['total_seconds'] -
                  item['break_total_seconds'] -
                  item['idle_total_seconds'] -
                  item['pause_total_seconds'],
              );

              item['break_total'] = Utils.nonZeroSec2time(item['break_total_seconds']);
              item['pause_total'] = Utils.nonZeroSec2time(item['pause_total_seconds']);
              item['idle_total'] = Utils.nonZeroSec2time(item['idle_total_seconds']);
              item['driving_total'] = Utils.nonZeroSec2time(
                item['driving_total_seconds'] > 0 ? item['driving_total_seconds'] : 0,
              );
              item['total'] = item['total_seconds'] > 0 ? Utils.nonZeroSec2time(item['total_seconds']) : 0;
            }
          }),
        );
      }
      return branch_result;
    }
  };

  const getAssignedClientList = async (company, branchId, user, dateRange) => {
    const vendorBranchNames = await getMainBranches(company, user, branchId);

    const assignedCasesByCountSql = `
    SELECT
      c.case_id,
      c.lender_client_id as id,
      c.lender_client_name as name,
      assignedCasesByClientsResult.count as clientsCount
    FROM
      cases c
    LEFT JOIN
    (
      SELECT
        case_id,
        vendor_branch_name as vendorBranchName,
        Count(*) as count
      FROM 
        cases
      WHERE
        status in (:statuses) AND
        order_date >=:start AND
        order_date <=:end
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND vendor_branch_name in (:vendorBranchNames)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
            : ``
        }
      GROUP BY
        lender_client_id
    ) as assignedCasesByClientsResult
    ON assignedCasesByClientsResult.case_id=c.case_id
    WHERE
      c.status in (:statuses) AND
      c.order_date >=:start AND
      c.order_date <=:end
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND vendor_branch_name in (:vendorBranchNames)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
          : ``
      }
    ORDER BY
      assignedCasesByClientsResult.count desc
    `;

    const assignedDetailsSql = `
    SELECT
      c.status,
      c.vendor_branch_name, c.order_date as date, c.lender_client_Id as id, 
      c.vin as name, c.lender_client_name, c.year_make_model, c.vendor_address as address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id, c.order_type
    FROM 
      cases c
    WHERE
      c.status in (:statuses) AND
      c.order_date >=:start AND
      c.order_date <=:end
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND vendor_branch_name in (:vendorBranchNames)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
          : ``
      }
      ORDER BY
        c.order_date DESC
    `;

    const currentDateReplacements = {
      start: dateRange.start,
      end: dateRange.end,
      statuses: values(CASE_STATUSES),
      vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
      subBranches: Utils.__SUB_BRANCHES__[company.dbName],
    };

    const previousDateReplacements = {
      start: dateRange.previousStart,
      end: dateRange.previousEnd,
      statuses: values(CASE_STATUSES),
      vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
      subBranches: Utils.__SUB_BRANCHES__[company.dbName],
    };

    let [assignedCases, assignedCasesDetails, previousMonthAssignedCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(assignedCasesByCountSql, {
        replacements: {
          ...currentDateReplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(assignedDetailsSql, {
        replacements: {
          ...currentDateReplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(assignedCasesByCountSql, {
        replacements: {
          ...previousDateReplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const assignedClientsDetails = [];
    assignedCases.map((assignedCase) => {
      if (assignedCase.clientsCount) {
        const previousMonthCase = find(
          previousMonthAssignedCases,
          (previousMonthAssignedCase) => previousMonthAssignedCase.id === assignedCase.id,
        );

        let clients = {
          id: assignedCase.id,
          name: assignedCase.name,
          value: assignedCase.clientsCount,
          previousValue: previousMonthCase ? previousMonthCase.clientsCount : 0,
        };
        clients['percentage'] =
          clients.previousValue !== 0 ? Utils.calculatePercentage(clients.value, clients.previousValue) : 100;

        const caseDetails = assignedCasesDetails.filter((assignedCaseDetails) => {
          return assignedCase.id === assignedCaseDetails.id;
        });

        if (caseDetails.length) {
          assignedClientsDetails.push({
            ...clients,
            details: caseDetails,
          });
        }
      }
    });
    return assignedClientsDetails;
  };

  const getRepossessedClientOrUserList = async (
    company,
    branchId,
    user,
    filterData,
    additionalQuery,
    type = CLIENT,
  ) => {
    const repossessedBranchNames = await getMainBranches(company, user, branchId);

    const repossessedCasesByCountSql = `
    SELECT
      c.case_id,
      ${
        type === CLIENT_AND_USER
          ? `c.lender_client_id as id, c.lender_client_name as name,`
          : type === CLIENT
          ? `c.lender_client_id as id,
         c.lender_client_name as name,
        `
          : `c.repo_agent_rdn_id as id,
          CONCAT(u.first_name, ' ', u.last_name) as name,
        `
      }
      Count(*) as count
    FROM
      cases c ${type !== CLIENT ? `, users u` : ``}
    WHERE
      c.status in (:statuses) AND
      c.rdn_repo_date >=:start AND
      c.rdn_repo_date <=:end
      ${type !== CLIENT ? `AND c.repo_agent_rdn_id = u.rdn_id` : ``}
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND repossessed_branch_name in (:repossessedBranchNames)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (repossessed_branch_name is null OR repossessed_branch_name not in (:subBranches))`
          : ``
      }
      ${additionalQuery}
      GROUP BY
      ${
        type !== USER
          ? `c.lender_client_id
      `
          : `c.repo_agent_rdn_id
      `
      }
    ORDER BY
      count desc
    `;

    const repossessedDetailsSql = `
    SELECT
      c.status,
      c.repossessed_branch_name, c.rdn_repo_date as date, 
      ${
        type === CLIENT_AND_USER
          ? `c.lender_client_Id as id, c.lender_client_name as name, u.first_name as repo_agent_first_name, u.last_name as repo_agent_last_name,`
          : type === CLIENT
          ? `c.lender_client_Id as id, c.lender_client_name as name,
        `
          : `c.repo_agent_rdn_id as id, u.first_name as repo_agent_first_name, u.last_name as repo_agent_last_name,
        `
      }
      c.vin, c.year_make_model, c.vendor_address, c.repo_address as address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id, 
      c.repo_agent_rdn_id,
      c.order_type
    FROM 
      cases c ${type !== CLIENT ? `, users u` : ``}
    WHERE
      c.status in (:statuses) AND
      c.rdn_repo_date >=:start AND
      c.rdn_repo_date <=:end
      ${type !== CLIENT ? `AND c.repo_agent_rdn_id = u.rdn_id` : ``}
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND repossessed_branch_name in (:repossessedBranchNames)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (repossessed_branch_name is null OR repossessed_branch_name not in (:subBranches))`
          : ``
      }
      ${additionalQuery}
      ORDER BY
        c.rdn_repo_date DESC
    `;

    const currentDateReplacements = {
      start: filterData.start,
      end: filterData.end,
      rdnId: filterData.rdnId,
      statuses: [CASE_STATUSES.repossessed],
      repossessedBranchNames: repossessedBranchNames.length ? repossessedBranchNames : [''],
      subBranches: Utils.__SUB_BRANCHES__[company.dbName],
    };

    const previousDateReplacements = {
      start: filterData.previousStart,
      end: filterData.previousEnd,
      rdnId: filterData.rdnId,
      statuses: [CASE_STATUSES.repossessed],
      repossessedBranchNames: repossessedBranchNames.length ? repossessedBranchNames : [''],
      subBranches: Utils.__SUB_BRANCHES__[company.dbName],
    };

    let [repossessedCases, repossessedVehicleDetails, previousMonthRepossessedCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(repossessedCasesByCountSql, {
        replacements: {
          ...currentDateReplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(repossessedDetailsSql, {
        replacements: {
          ...currentDateReplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(repossessedCasesByCountSql, {
        replacements: {
          ...previousDateReplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const repossessedClientsOrUsers = [];
    repossessedCases.map((repossessedCase) => {
      if (repossessedCase.count) {
        const previousMonthCase = find(
          previousMonthRepossessedCases,
          (previousMonthAssignedCase) => previousMonthAssignedCase.id === repossessedCase.id,
        );

        let clientsOrUsers = {
          id: repossessedCase.id,
          name: repossessedCase.name,
          value: repossessedCase.count,
          previousValue: previousMonthCase ? previousMonthCase.count : 0,
        };
        clientsOrUsers['percentage'] =
          clientsOrUsers.previousValue !== 0
            ? Utils.calculatePercentage(clientsOrUsers.value, clientsOrUsers.previousValue)
            : 100;

        const matchedVehicleDetails = repossessedVehicleDetails.filter((repossessedVehicleDetail) => {
          return repossessedCase.id === repossessedVehicleDetail.id;
        });
        if (matchedVehicleDetails.length) {
          repossessedClientsOrUsers.push({
            ...clientsOrUsers,
            details: matchedVehicleDetails,
          });
        }
      }
    });
    return repossessedClientsOrUsers;
  };

  const getSpottedCaseClientOrUserList = async (
    company,
    branchId,
    user,
    filterData,
    additionalQuery,
    type = CLIENT,
  ) => {
    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const spottedCasesByCountSql = `
    SELECT
      c.case_id,
      ${
        type === CLIENT_AND_USER
          ? `c.lender_client_id as id, c.lender_client_name as name`
          : type === CLIENT
          ? `c.lender_client_id as id,
         c.lender_client_name as name
        `
          : `c.spotter_id as id,
         CONCAT(u.first_name, ' ', u.last_name) as name
        `
      }
      ,Count(*) as count
    FROM
      cases c ${type !== CLIENT ? `, users u` : ``}
    WHERE
      c.spotted_date >=:start AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${type !== CLIENT ? `AND c.spotter_id = u.id` : ``}
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      ${additionalQuery}
    GROUP BY
    ${
      type !== USER
        ? `c.lender_client_id 
      `
        : `c.spotter_id
      `
    }
    ORDER BY
      count desc
    `;

    const vehicleDetailsSql = `
    SELECT
      c.status,
      c.spotted_branch_id,
      ${
        type === CLIENT_AND_USER
          ? `c.lender_client_Id as id, c.lender_client_name as name, u.first_name as spotter_first_name, u.last_name as spotter_last_name,`
          : type === CLIENT
          ? `c.lender_client_Id as id, c.lender_client_name as name,
        `
          : `c.spotter_id as id, u.first_name, u.last_name,
        `
      }
      c.spotted_date as date,
      c.vin as name, c.year_make_model, c.vendor_address, c.spotted_address as address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id
    FROM 
      cases c ${type !== CLIENT ? `, users u` : ``}
    WHERE
      c.spotted_date >=:start AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${type !== CLIENT ? `AND c.spotter_id = u.id` : ``}
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      ${additionalQuery}
      ORDER BY
        c.spotted_date DESC
    `;

    const currentDayreplacements = {
      start: filterData.start,
      end: filterData.end,
      spottedId: filterData.spottedId,
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    const previousDayreplacements = {
      start: filterData.previousStart,
      end: filterData.previousEnd,
      spottedId: filterData.spottedId,
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    let [spottedCases, spottedVehicleDetails, previousDaySpottedCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(spottedCasesByCountSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(vehicleDetailsSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(spottedCasesByCountSql, {
        replacements: {
          ...previousDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const spottedCasesClientsOrUsers = [];
    spottedCases.map((spottedCase) => {
      if (spottedCase.count) {
        const previousDayCase = find(
          previousDaySpottedCases,
          (previousDaySpottedCase) => previousDaySpottedCase.id === spottedCase.id,
        );

        let clientsOrUsers = {
          id: spottedCase.id,
          name: spottedCase.name,
          value: spottedCase.count,
          previousValue: previousDayCase ? previousDayCase.count : 0,
        };
        clientsOrUsers['percentage'] =
          clientsOrUsers.previousValue !== 0
            ? Utils.calculatePercentage(clientsOrUsers.value, clientsOrUsers.previousValue)
            : 100;

        const matchedVehicleDetails = spottedVehicleDetails.filter((spottedVehicleDetail) => {
          return spottedCase.id === spottedVehicleDetail.id;
        });
        if (matchedVehicleDetails.length) {
          spottedCasesClientsOrUsers.push({
            ...clientsOrUsers,
            details: matchedVehicleDetails,
          });
        }
      }
    });

    return spottedCasesClientsOrUsers;
  };

  const getSpottedClientOrUserList = async (company, branchId, user, dateRange, timezoneOffset, type = CLIENT) => {
    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const spottedCasesByCountSql = `
    SELECT
      c.case_id,
      ${
        type === CLIENT
          ? `c.lender_client_id as id,
         c.lender_client_name as name
        `
          : `c.spotter_id as id,
         CONCAT(u.first_name, ' ', u.last_name) as name
        `
      }
      ,Count(*) as count
    FROM
      cases c ${type === USER ? `, users u` : ``}
    WHERE
      c.spotted_date >=:start AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${type === USER ? `AND c.spotter_id = u.id` : ``}
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
    GROUP BY
    ${
      type === CLIENT
        ? `c.lender_client_id 
      `
        : `c.spotter_id
      `
    }
    ORDER BY
      count desc
    `;

    const vehicleDetailsSql = `
    SELECT
      c.status,
      c.spotted_branch_id,
      ${
        type === CLIENT
          ? `c.lender_client_Id as id, c.lender_client_name,
        `
          : `c.spotter_id as id, u.first_name, u.last_name,
        `
      }
      c.spotted_date as date,
      c.vin as name, c.year_make_model, c.vendor_address, c.spotted_address as address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id
    FROM 
      cases c ${type === USER ? `, users u` : ``}
    WHERE
      c.spotted_date >=:start AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${type === USER ? `AND c.spotter_id = u.id` : ``}
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      ORDER BY
        c.spotted_date DESC
    `;

    const currentDayreplacements = {
      start: moment(dateRange.start)
        .add(timezoneOffset + SPOTTED_FROM_TIME, 'hours')
        .add(1, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss'),
      end: moment(dateRange.end)
        .add(1, 'days')
        .add(timezoneOffset + SPOTTED_TO_TIME, 'hours')
        .format('YYYY-MM-DD HH:mm:ss'),
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    const previousDayreplacements = {
      start: moment(dateRange.start)
        .subtract(1, 'days')
        .add(timezoneOffset + SPOTTED_FROM_TIME, 'hours')
        .add(1, 'minutes')
        .format(),
      end: moment(dateRange.end)
        .add(timezoneOffset + SPOTTED_TO_TIME, 'hours')
        .format(),
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    let [spottedCases, spottedVehicleDetails, previousDaySpottedCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(spottedCasesByCountSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(vehicleDetailsSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(spottedCasesByCountSql, {
        replacements: {
          ...previousDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const spottedCasesClientsOrUsers = [];
    spottedCases.map((spottedCase) => {
      if (spottedCase.count) {
        const previousDayCase = find(
          previousDaySpottedCases,
          (previousDaySpottedCase) => previousDaySpottedCase.id === spottedCase.id,
        );

        let clientsOrUsers = {
          id: spottedCase.id,
          name: spottedCase.name,
          value: spottedCase.count,
          previousValue: previousDayCase ? previousDayCase.count : 0,
        };
        clientsOrUsers['percentage'] =
          clientsOrUsers.previousValue !== 0
            ? Utils.calculatePercentage(clientsOrUsers.value, clientsOrUsers.previousValue)
            : 100;

        const matchedVehicleDetails = spottedVehicleDetails.filter((spottedVehicleDetail) => {
          return spottedCase.id === spottedVehicleDetail.id;
        });
        if (matchedVehicleDetails.length) {
          spottedCasesClientsOrUsers.push({
            ...clientsOrUsers,
            details: matchedVehicleDetails,
          });
        }
      }
    });

    return spottedCasesClientsOrUsers;
  };

  const getSpottedNotSecuredClientList = async (
    company,
    branchId,
    user,
    dateRange,
    timezoneOffset,
    previousType,
  ) => {
    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const spottedNotSecuredCasesByCountSql = `
    SELECT
      c.case_id,
      c.lender_client_id as id,
      c.lender_client_name as name,
      spottedNotSecuredCasesByClientsResult.count as clientsCount
    FROM
      cases c
    LEFT JOIN
    (
      SELECT
        case_id,
        spotted_branch_id as spottedBranchId,
        Count(*) as count
      FROM 
        cases
      WHERE
        status not in (:statuses) AND
        spotted_date >=:start AND
        spotted_date <=:end AND
        spotted_date is not null
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND spotted_branch_id in (:spottedBranchIds)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
            : ``
        }
      GROUP BY
        lender_client_id
    ) as spottedNotSecuredCasesByClientsResult
    ON spottedNotSecuredCasesByClientsResult.case_id=c.case_id
    WHERE
      c.status not in (:statuses) AND
      c.spotted_date >=:start AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
    ORDER BY
      spottedNotSecuredCasesByClientsResult.count desc
    `;

    const vehicleDetailsSql = `
    SELECT
      c.status,
      c.spotted_branch_id, c.lender_client_Id as id, c.vendor_address, c.spotted_date as date,
      c.vin as name, c.lender_client_name, c.year_make_model, c.spotted_address as address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id, 
      user_branch_result.user_id,
      user_branch_result.first_name,
      user_branch_result.last_name,
      user_branch_result.avatar_url,
      user_branch_result.branch_name
    FROM 
      cases c
    LEFT JOIN
      (
        SELECT 
          u.id as user_id,
          u.rdn_id,
          u.first_name,
          u.last_name,
          u.avatar_url,
          b.name as branch_name
        FROM 
          users u,
          branches b
        WHERE
          b.id=u.branch_id
      ) as user_branch_result
    ON user_branch_result.user_id=c.spotter_id
    WHERE
      c.status not in (:statuses) AND
      c.spotted_date >=:start AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      ORDER BY
        c.spotted_date DESC
    `;

    const currentDayreplacements = {
      start: moment(dateRange.start)
        .add(timezoneOffset + SPOTTED_NOT_SECURED_FROM_TIME, 'hours')
        .add(1, 'minutes')
        .format('YYYY-MM-DD HH:mm:ss'),
      end: moment(dateRange.end)
        .add(1, 'days')
        .add(timezoneOffset + SPOTTED_NOT_SECURED_TO_TIME, 'hours')
        .format('YYYY-MM-DD HH:mm:ss'),
      statuses: [CASE_STATUSES.repossessed],
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    const previousDayreplacements = {
      start: moment(dateRange.start)
        .subtract(1, previousType)
        .add(timezoneOffset + SPOTTED_NOT_SECURED_FROM_TIME, 'hours')
        .add(1, 'minutes')
        .format(),
      end: moment(dateRange.end)
        .add(timezoneOffset + SPOTTED_NOT_SECURED_TO_TIME, 'hours')
        .format(),
      statuses: [CASE_STATUSES.repossessed],
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    let [spottedNotSecuredCases, spottedNotSecuredClientsDetails, previousDaySpottedNotSecuredCases] =
      await Promise.all([
        db[`${company.dbName}_sequelize`].query(spottedNotSecuredCasesByCountSql, {
          replacements: {
            ...currentDayreplacements,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
        db[`${company.dbName}_sequelize`].query(vehicleDetailsSql, {
          replacements: {
            ...currentDayreplacements,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
        db[`${company.dbName}_sequelize`].query(spottedNotSecuredCasesByCountSql, {
          replacements: {
            ...previousDayreplacements,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      ]);

    const spottedNotSecuredCasesClients = [];
    spottedNotSecuredCases.map((spottedNotSecuredCase) => {
      if (spottedNotSecuredCase.clientsCount) {
        const previousDayCase = find(
          previousDaySpottedNotSecuredCases,
          (previousDaySpottedNotSecuredCase) => previousDaySpottedNotSecuredCase.id === spottedNotSecuredCase.id,
        );

        let clients = {
          id: spottedNotSecuredCase.id,
          name: spottedNotSecuredCase.name,
          value: spottedNotSecuredCase.clientsCount,
          previousValue: previousDayCase ? previousDayCase.clientsCount : 0,
        };
        clients['percentage'] =
          clients.previousValue !== 0 ? Utils.calculatePercentage(clients.value, clients.previousValue) : 100;

        const matchedClientDetails = spottedNotSecuredClientsDetails.filter((spottedNotSecuredClientDetails) => {
          return spottedNotSecuredCase.id === spottedNotSecuredClientDetails.id;
        });
        if (matchedClientDetails.length) {
          spottedNotSecuredCasesClients.push({
            ...clients,
            details: matchedClientDetails,
          });
        }
      }
    });

    return spottedNotSecuredCasesClients;
  };

  const getAccountNotCheckedClientList = async (company, branchId, user, dateRange, previousType) => {
    const vendorBranchNames = await getMainBranches(company, user, branchId);

    const assignedCasesSql = `
      SELECT
        case_id
      FROM
        cases
      WHERE
        status in (:statuses) AND
        order_date >=:start AND
        order_date <=:end
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND vendor_branch_name in (:vendorBranchNames)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
            : ``
        }
    `;

    const checkedInsCasesSql = `
      SELECT
        case_id
      FROM
        user_activities
      WHERE
        updated_type in (:agentUpdateTypes)
    `;

    let [assignedCases, previousDayAssignedCases, checkedInCases, previousDayCheckedInCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(assignedCasesSql, {
        replacements: {
          start: moment(dateRange.start)
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_FROM_TIME, 'hours')
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(dateRange.end)
            .add(1, 'days')
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_TO_TIME, 'hours')
            .subtract(1, 'minutes')
            .format('YYYY-MM-DD HH:mm:ss'),
          statuses: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(assignedCasesSql, {
        replacements: {
          start: moment(dateRange.start)
            .subtract(1, previousType)
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_FROM_TIME, 'hours')
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(dateRange.end)
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_TO_TIME, 'hours')
            .subtract(1, 'minutes')
            .format('YYYY-MM-DD HH:mm:ss'),
          statuses: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(checkedInsCasesSql, {
        replacements: {
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(checkedInsCasesSql, {
        replacements: {
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const assignedCaseIds = map(assignedCases, 'case_id');
    const checkedInCaseIds = map(checkedInCases, 'case_id');

    let accountNotCheckedByBranchValue = assignedCaseIds.filter((assignedCaseId) => {
      return !checkedInCaseIds.includes(assignedCaseId);
    });

    const previousDayAssignedCaseIds = map(previousDayAssignedCases, 'case_id');
    const previousDayCheckedInCaseIds = map(previousDayCheckedInCases, 'case_id');

    let accountNotCheckedByBranchPreviousValue = previousDayAssignedCaseIds.filter((previousDayAssignedCaseId) => {
      return !previousDayCheckedInCaseIds.includes(previousDayAssignedCaseId);
    });

    const accountNotCheckedCasesByCountSql = `
    SELECT
      c.lender_client_id as id,
      c.lender_client_name as name,
      count(*) as clientsCount
    FROM
      cases c
    WHERE
      case_id in (:caseIds)
    GROUP BY 
      c.lender_client_id
    ORDER BY
      clientsCount desc
    `;

    const vehicleDetailsSql = `
    SELECT
      c.status,
      c.order_type as orderType,
      c.vendor_branch_name, c.lender_client_Id as id, c.vendor_address as address, c.order_date as date,
      c.vin as name, c.lender_client_name, c.year_make_model, 
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id
    FROM 
      cases c
    WHERE
      case_id in (:caseIds)
    ORDER BY
      c.order_date DESC
    `;

    let [accountNotCheckedCases, accountNotCheckedClientsDetails, previousDayAccountNotCheckedCases] =
      await Promise.all([
        db[`${company.dbName}_sequelize`].query(accountNotCheckedCasesByCountSql, {
          replacements: {
            caseIds: accountNotCheckedByBranchValue.length ? accountNotCheckedByBranchValue : [''],
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
        db[`${company.dbName}_sequelize`].query(vehicleDetailsSql, {
          replacements: {
            caseIds: accountNotCheckedByBranchValue.length ? accountNotCheckedByBranchValue : [''],
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
        db[`${company.dbName}_sequelize`].query(accountNotCheckedCasesByCountSql, {
          replacements: {
            caseIds: accountNotCheckedByBranchPreviousValue.length ? accountNotCheckedByBranchPreviousValue : [''],
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      ]);

    const accountNotCheckedCasesClients = [];
    accountNotCheckedCases.map((accountNotCheckedCase) => {
      if (accountNotCheckedCase.clientsCount) {
        const previousDayCase = find(
          previousDayAccountNotCheckedCases,
          (previousDayAccountNotCheckedCase) => previousDayAccountNotCheckedCase.id === accountNotCheckedCase.id,
        );

        let clients = {
          id: accountNotCheckedCase.id,
          name: accountNotCheckedCase.name,
          value: accountNotCheckedCase.clientsCount,
          previousValue: previousDayCase ? previousDayCase.clientsCount : 0,
        };
        clients['percentage'] =
          clients.previousValue !== 0 ? Utils.calculatePercentage(clients.value, clients.previousValue) : 100;

        const matchedClientDetails = accountNotCheckedClientsDetails.filter((accountNotCheckedClientDetails) => {
          return accountNotCheckedCase.id === accountNotCheckedClientDetails.id;
        });
        if (matchedClientDetails.length) {
          accountNotCheckedCasesClients.push({
            ...clients,
            details: matchedClientDetails,
          });
        }
      }
    });

    return accountNotCheckedCasesClients;
  };

  const getCheckInsClientList = async (company, branchId, user, dateRange, previousType) => {
    const vendorBranchNames = await getMainBranches(company, user, branchId);

    const assignedCasesSql = `
      SELECT
        case_id
      FROM
        cases
      WHERE
        status in (:statuses) AND
        order_date >=:start AND
        order_date <=:end
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND vendor_branch_name in (:vendorBranchNames)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (vendor_branch_name is null OR vendor_branch_name not in (:subBranches))`
            : ``
        }
    `;

    const checkedInsCasesSql = `
      SELECT
        case_id
      FROM
        user_activities
      WHERE
        updated_type in (:agentUpdateTypes)
    `;

    let [assignedCases, previousDayAssignedCases, checkedInCases, previousDayCheckedInCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(assignedCasesSql, {
        replacements: {
          start: moment(dateRange.start)
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_FROM_TIME, 'hours')
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(dateRange.end)
            .add(1, 'days')
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_TO_TIME, 'hours')
            .subtract(1, 'minutes')
            .format('YYYY-MM-DD HH:mm:ss'),
          statuses: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(assignedCasesSql, {
        replacements: {
          start: moment(dateRange.start)
            .subtract(1, previousType)
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_FROM_TIME, 'hours')
            .format('YYYY-MM-DD HH:mm:ss'),
          end: moment(dateRange.end)
            .add(-RDN_SERVER_TIME_ZONE_OFFSET + ASSIGNMENT_TO_TIME, 'hours')
            .subtract(1, 'minutes')
            .format('YYYY-MM-DD HH:mm:ss'),
          statuses: values(CASE_STATUSES),
          vendorBranchNames: vendorBranchNames.length ? vendorBranchNames : [''],
          subBranches: Utils.__SUB_BRANCHES__[company.dbName],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(checkedInsCasesSql, {
        replacements: {
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(checkedInsCasesSql, {
        replacements: {
          agentUpdateTypes: AGENT_UPDATE_TYPES,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const assignedCaseIds = map(assignedCases, 'case_id');
    const checkedInCaseIds = map(checkedInCases, 'case_id');

    let checkInsByBranchValue = assignedCaseIds.filter((assignedCaseId) => {
      return checkedInCaseIds.includes(assignedCaseId);
    });

    const previousDayAssignedCaseIds = map(previousDayAssignedCases, 'case_id');
    const previousDayCheckedInCaseIds = map(previousDayCheckedInCases, 'case_id');

    let checkInsByBranchPreviousValue = previousDayAssignedCaseIds.filter((previousDayAssignedCaseId) => {
      return previousDayCheckedInCaseIds.includes(previousDayAssignedCaseId);
    });

    const checkInsCasesByCountSql = `
    SELECT
      c.lender_client_id as id,
      c.lender_client_name as name,
      count(*) as clientsCount
    FROM
      cases c
    WHERE
      case_id in (:caseIds)
    GROUP BY 
      c.lender_client_id
    ORDER BY
      clientsCount desc
    `;

    const vehicleDetailsSql = `
    SELECT
      c.status,
      c.vendor_branch_name, c.lender_client_Id as id, c.vendor_address as address, c.order_date as date,
      c.vin as name, c.lender_client_name, c.year_make_model, 
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id
    FROM 
      cases c
    WHERE
      case_id in (:caseIds)
    ORDER BY
      c.order_date DESC
    `;

    let [checkInsCases, checkInsClientsDetails, previousDayCheckInsCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(checkInsCasesByCountSql, {
        replacements: {
          caseIds: checkInsByBranchValue.length ? checkInsByBranchValue : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(vehicleDetailsSql, {
        replacements: {
          caseIds: checkInsByBranchValue.length ? checkInsByBranchValue : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(checkInsCasesByCountSql, {
        replacements: {
          caseIds: checkInsByBranchPreviousValue.length ? checkInsByBranchPreviousValue : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const checkInsCasesClients = [];
    checkInsCases.map((checkInsCase) => {
      if (checkInsCase.clientsCount) {
        const previousDayCase = find(
          previousDayCheckInsCases,
          (previousDayAccountNotCheckedCase) => previousDayAccountNotCheckedCase.id === checkInsCase.id,
        );

        let clients = {
          id: checkInsCase.id,
          name: checkInsCase.name,
          value: checkInsCase.clientsCount,
          previousValue: previousDayCase ? previousDayCase.clientsCount : 0,
        };
        clients['percentage'] =
          clients.previousValue !== 0 ? Utils.calculatePercentage(clients.value, clients.previousValue) : 100;

        const matchedClientDetails = checkInsClientsDetails.filter((checkInsClientDetails) => {
          return checkInsCase.id === checkInsClientDetails.id;
        });
        if (matchedClientDetails.length) {
          checkInsCasesClients.push({
            ...clients,
            details: matchedClientDetails,
          });
        }
      }
    });

    return checkInsCasesClients;
  };

  const getUserScanList = async (company, branchId, user, scannedAt, previousType) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }

    const usersScanCountSql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.avatar_url,
      b.id as branch_id,
      b.name as branch_name,
      sum(cs.count) as usersCount
    FROM
      camera_scans cs,
      users u,
      branches b
    WHERE
      cs.scanned_at =:scannedAt AND
      cs.drn_id = u.drn_id AND
      u.branch_id = b.id
      ${
        ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE) &&
        branchId !== UNKNOWN_BRANCH_ID
          ? `AND b.id=:branchId`
          : ``
      }
      ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
    GROUP BY 
      u.id
    ORDER BY
      usersCount desc
    `;

    const currentDayreplacements = {
      scannedAt,
      branchId,
    };

    const previousDayreplacements = {
      scannedAt: moment(scannedAt).subtract(1, previousType).format('YYYY-MM-DD'),
      branchId,
    };

    let [usersScan, previousDayUsersScan] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(usersScanCountSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(usersScanCountSql, {
        replacements: {
          ...previousDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const usersScanList = [];
    usersScan.map((userScan) => {
      if (userScan.usersCount) {
        const previousDayCase = find(
          previousDayUsersScan,
          (previousDayUserScan) => previousDayUserScan.id === userScan.id,
        );

        let users = {
          id: userScan.id,
          name: `${userScan.first_name} ${userScan.last_name}`,
          value: userScan.usersCount,
          previousValue: previousDayCase ? previousDayCase.usersCount : 0,
        };
        users['percentage'] =
          users.previousValue !== 0 ? Utils.calculatePercentage(users.value, users.previousValue) : 100;

        usersScanList.push({
          ...users,
        });
      }
    });

    return usersScanList;
  };
  const getUserHitsList = async (company, branchId, user, scannedAt, previousType) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }

    const usersHitsCountSql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.avatar_url,
      b.id as branch_id,
      b.name as branch_name,
      sum(ch.count) as usersCount
    FROM
    camera_hits ch,
      users u,
      branches b
    WHERE
      ch.scanned_at =:scannedAt AND
      ch.drn_id = u.drn_id AND
      u.branch_id = b.id
      ${
        ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE) &&
        branchId !== UNKNOWN_BRANCH_ID
          ? `AND b.id=:branchId`
          : ``
      }
      ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
    GROUP BY 
      u.id
    ORDER BY
      usersCount desc
    `;

    const currentDayreplacements = {
      scannedAt,
      branchId,
    };

    const previousDayreplacements = {
      scannedAt: moment(scannedAt).subtract(1, previousType).format('YYYY-MM-DD'),
      branchId,
    };

    let [usersHits, previousDayUsersHit] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(usersHitsCountSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(usersHitsCountSql, {
        replacements: {
          ...previousDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const usersHitList = [];
    usersHits.map((userHit) => {
      if (userHit.usersCount) {
        const previousDayCase = find(
          previousDayUsersHit,
          (previousDayUserScan) => previousDayUserScan.id === userHit.id,
        );

        let users = {
          id: userHit.id,
          name: `${userHit.first_name} ${userHit.last_name}`,
          value: userHit.usersCount,
          previousValue: previousDayCase ? previousDayCase.usersCount : 0,
        };
        users['percentage'] =
          users.previousValue !== 0 ? Utils.calculatePercentage(users.value, users.previousValue) : 100;

        usersHitList.push({
          ...users,
        });
      }
    });

    return usersHitList;
  };

  const geLiveHitsNotSecuredListByUser = async (company, branchId, user, scannedAt, previousType) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }

    const cameraHitsQuery = `
    SELECT ch.direct,b.name as vendorBranchName,ch.direct_hits_vins
      FROM
      camera_hits ch
      INNER JOIN 
        users u 
      ON 
        ch.drn_id=u.drn_id
      INNER JOIN 
        branches b 
      ON 
        b.id=u.branch_id
      WHERE ch.scanned_at =:scannedAt AND
      ch.direct_hits_vins IS NOT NULL
      ${
        ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE) &&
        branchId !== UNKNOWN_BRANCH_ID
          ? `AND b.id=:branchId`
          : ``
      }
      ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
  `;

    let [cameraHits, previousDayCameraHits] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          scannedAt,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          scannedAt: moment(scannedAt).subtract(1, previousType).format('YYYY-MM-DD'),
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let cameraHitsVin = [];
    cameraHits.map((item) => {
      const array = JSON.parse(item.direct_hits_vins);
      for (let i = 0; i < array.length; i++) {
        cameraHitsVin.push(array[i]);
      }
    });
    let previousDayCameraHitsVin = [];
    previousDayCameraHits.map((item) => {
      const array = JSON.parse(item.direct_hits_vins);
      for (let i = 0; i < array.length; i++) {
        previousDayCameraHitsVin.push(array[i]);
      }
    });

    const cameraHitsVinCount =
      cameraHitsVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select * from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:cameraHitsVin) and status != '${CASE_STATUSES.repossessed}'`,
            {
              replacements: {
                cameraHitsVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const previousDayCameraHitsVinCount =
      previousDayCameraHitsVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select * from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:previousDayCameraHitsVin) and status != '${CASE_STATUSES.repossessed}'`,
            {
              replacements: {
                previousDayCameraHitsVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const usersScanCountSql = `
    SELECT
      u.id,
      u.first_name,
      u.last_name,
      u.avatar_url,
      b.id as branch_id,
      b.name as branch_name,
      ch.direct_hits_vins,
      sum(ch.count) as usersCount
    FROM
    camera_hits ch,
      users u,
      branches b
    WHERE
      ch.scanned_at =:scannedAt AND
      ch.drn_id = u.drn_id AND
      u.branch_id = b.id
      ${
        ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE) &&
        branchId !== UNKNOWN_BRANCH_ID
          ? `AND b.id=:branchId`
          : ``
      }
      ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
    GROUP BY 
      u.id
    ORDER BY
      usersCount desc
    `;

    let [cameraHitsNotSecuredlist, previousDayCameraHitsNotSecuredlist] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(usersScanCountSql, {
        replacements: {
          scannedAt,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(usersScanCountSql, {
        replacements: {
          scannedAt: moment(scannedAt) // 9:01 am local
            .subtract(1, previousType)
            .format('YYYY-MM-DD'),
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    cameraHitsNotSecuredlist.map((cameraHitNotSecuredlist) => {
      const nonRepossessedList = cameraHitsVinCount.filter(
        (cameraHitVinCount) =>
          cameraHitNotSecuredlist.direct_hits_vins &&
          cameraHitNotSecuredlist.direct_hits_vins.includes(cameraHitVinCount.last8Vin),
      );
      cameraHitNotSecuredlist.count = nonRepossessedList.length;
    });

    previousDayCameraHitsNotSecuredlist.map((previousDayCameraHitsNotSecuredlist) => {
      const nonRepossessedList = previousDayCameraHitsVinCount.filter(
        (previousDayCameraHitVinCount) =>
          previousDayCameraHitsNotSecuredlist.direct_hits_vins &&
          previousDayCameraHitsNotSecuredlist.direct_hits_vins.includes(previousDayCameraHitVinCount.last8Vin),
      );
      previousDayCameraHitsNotSecuredlist.count = nonRepossessedList.length;
    });

    const usersHitList = [];
    cameraHitsNotSecuredlist.map((userHit) => {
      if (userHit.usersCount) {
        const previousDayCase = find(
          previousDayCameraHitsNotSecuredlist,
          (previousDayUserScan) => previousDayUserScan.id === userHit.id,
        );

        let users = {
          id: userHit.id,
          name: `${userHit.first_name} ${userHit.last_name}`,
          value: userHit.count,
          previousValue: previousDayCase ? previousDayCase.count : 0,
        };
        users['percentage'] =
          users.previousValue !== 0 ? Utils.calculatePercentage(users.value, users.previousValue) : 100;

        usersHitList.push({
          ...users,
        });
      }
    });

    return usersHitList;
  };
  const getCameraCarsHitAndSecuredListByClientOrUser = async (
    company,
    branchId,
    user,
    filterData,
    additionalquery,
  ) => {
    if (branchId === COMPANY_WIDE_BRANCH_ID && user.role.role !== SUPER_ADMIN_ROLE) {
      branchId = user.branchId;
    }
    if (
      branchId !== COMPANY_WIDE_BRANCH_ID &&
      branchId !== UNKNOWN_BRANCH_ID &&
      user.role.role !== SUPER_ADMIN_ROLE
    ) {
      if (branchId !== user.branchId) {
        branchId = UNKNOWN_BRANCH_ID;
      }
    }

    const cameraHitsQuery = `
    SELECT ch.direct,b.name as vendorBranchName,ch.direct_hits_vins,ch.lpr_vins
      FROM
      camera_hits ch
      INNER JOIN 
        users u 
      ON 
        ch.drn_id=u.drn_id 
      INNER JOIN 
        branches b 
      ON 
        b.id=u.branch_id
      WHERE ch.scanned_at >=:start
      AND ch.scanned_at<=:end AND
      u.drn_id = :drn_id
      ${
        ((branchId !== COMPANY_WIDE_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE) &&
        branchId !== UNKNOWN_BRANCH_ID
          ? `AND b.id=:branchId`
          : ``
      }
      ${branchId === UNKNOWN_BRANCH_ID ? `AND b.id is null` : ``}
  `;

    let [cameraHits, previousDayCameraHits] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          start: filterData.start,
          end: filterData.end,
          drn_id: filterData.drnId,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraHitsQuery, {
        replacements: {
          start: filterData.previousStart,
          end: filterData.previousEnd,
          drn_id: filterData.drnId,
          branchId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let cameraHitsDrectVin = [];
    cameraHits.map((item) => {
      const array = item.direct_hits_vins ? JSON.parse(item.direct_hits_vins) : [];
      for (let i = 0; i < array.length; i++) {
        cameraHitsDrectVin.push(array[i]);
      }
    });

    let cameraHitsLprVin = [];
    cameraHits.map((item) => {
      const array = item.lpr_vins ? JSON.parse(item.lpr_vins) : [];
      for (let i = 0; i < array.length; i++) {
        cameraHitsLprVin.push(array[i]);
      }
    });

    let previousDayCameraHitsDirectVin = [];
    previousDayCameraHits.map((item) => {
      const array = item.direct_hits_vins ? JSON.parse(item.direct_hits_vins) : [];
      for (let i = 0; i < array.length; i++) {
        previousDayCameraHitsDirectVin.push(array[i]);
      }
    });

    let previousDayCameraHitsLprVin = [];
    previousDayCameraHits.map((item) => {
      const array = item.lpr_vins ? JSON.parse(item.lpr_vins) : [];
      for (let i = 0; i < array.length; i++) {
        previousDayCameraHitsLprVin.push(array[i]);
      }
    });

    const cameraHitsVinLprCount =
      cameraHitsLprVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select case_id,lender_client_id as id,lender_client_name as name,Count(*) as count from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:cameraHitsLprVin) ${additionalquery} GROUP BY lender_client_id ORDER BY count desc`,
            {
              replacements: {
                cameraHitsLprVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const previousDayCameraHitsLprVinCount =
      previousDayCameraHitsLprVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select case_id,lender_client_id as id,lender_client_name as name,Count(*) as count from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:previousDayCameraHitsLprVin) ${additionalquery} GROUP BY lender_client_id ORDER BY count desc`,
            {
              replacements: {
                previousDayCameraHitsLprVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const cameraHitsVinDirectCount =
      cameraHitsDrectVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select case_id,lender_client_id as id,lender_client_name as name,Count(*) as count from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:cameraHitsDrectVin) ${additionalquery} GROUP BY lender_client_id ORDER BY count desc`,
            {
              replacements: {
                cameraHitsDrectVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const previousDayCameraHitsDirectVinCount =
      previousDayCameraHitsDirectVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `Select case_id,lender_client_id as id,lender_client_name as name,Count(*) as count from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:previousDayCameraHitsDirectVin) ${additionalquery} GROUP BY lender_client_id ORDER BY count desc`,
            {
              replacements: {
                previousDayCameraHitsDirectVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];

    const cameraHitsAndSecuredLprVinslist =
      cameraHitsLprVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `
          Select status,case_id,lender_client_id as id,lender_client_name as name,vin as name,year_make_model,vendor_address,spotted_address as address,
          vehicle_color, vehicle_license_number, vehicle_license_state
          from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:cameraHitsLprVin) ${additionalquery}
        `,
            {
              replacements: {
                cameraHitsLprVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];
    const cameraHitsAndSecuredDirectVinslist =
      cameraHitsDrectVin.length > 0
        ? await db[`${company.dbName}_sequelize`].query(
            `
        Select status,case_id,lender_client_id as id,lender_client_name as name,vin as name,year_make_model,vendor_address,spotted_address as address,
        vehicle_color, vehicle_license_number, vehicle_license_state
        from (SELECT *, SUBSTR(vin ,-8) as last8Vin FROM cases) as result where last8Vin in (:cameraHitsDrectVin) ${additionalquery}
      `,
            {
              replacements: {
                cameraHitsDrectVin,
              },
              type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
            },
          )
        : [];
    const usersHitLprVinList = [];
    cameraHitsVinLprCount.map((cameraHitsLprVinCounts) => {
      if (cameraHitsLprVinCounts.count) {
        const previousDayCase = find(
          previousDayCameraHitsLprVinCount,
          (previousDayCameraHitsLprVins) => previousDayCameraHitsLprVins.id === cameraHitsLprVinCounts.id,
        );

        let clientsOrUsers = {
          id: cameraHitsLprVinCounts.id,
          name: cameraHitsLprVinCounts.name,
          value: cameraHitsLprVinCounts.count,
          previousValue: previousDayCase ? previousDayCase.count : 0,
        };
        clientsOrUsers['percentage'] =
          clientsOrUsers.previousValue !== 0
            ? Utils.calculatePercentage(clientsOrUsers.value, clientsOrUsers.previousValue)
            : 100;

        const matchedVehicleDetails = cameraHitsAndSecuredLprVinslist.filter(
          (cameraHitAndSecuredLprVinsVehicleDetail) => {
            return cameraHitsLprVinCounts.id === cameraHitAndSecuredLprVinsVehicleDetail.id;
          },
        );
        if (matchedVehicleDetails.length) {
          usersHitLprVinList.push({
            ...clientsOrUsers,
            details: matchedVehicleDetails,
          });
        }
      }
    });
    const usersHitDirectVinList = [];
    cameraHitsVinDirectCount.map((cameraHitsDirectVinCounts) => {
      if (cameraHitsDirectVinCounts.count) {
        const previousDayCase = find(
          previousDayCameraHitsDirectVinCount,
          (previousDayCameraHitsDirectVins) => previousDayCameraHitsDirectVins.id === cameraHitsDirectVinCounts.id,
        );

        let clientsOrUsers = {
          id: cameraHitsDirectVinCounts.id,
          name: cameraHitsDirectVinCounts.name,
          value: cameraHitsDirectVinCounts.count,
          previousValue: previousDayCase ? previousDayCase.count : 0,
        };
        clientsOrUsers['percentage'] =
          clientsOrUsers.previousValue !== 0
            ? Utils.calculatePercentage(clientsOrUsers.value, clientsOrUsers.previousValue)
            : 100;

        const matchedVehicleDetails = cameraHitsAndSecuredDirectVinslist.filter(
          (cameraHitAndSecuredDirectVinsVehicleDetail) => {
            return cameraHitsDirectVinCounts.id === cameraHitAndSecuredDirectVinsVehicleDetail.id;
          },
        );
        if (matchedVehicleDetails.length) {
          usersHitDirectVinList.push({
            ...clientsOrUsers,
            details: matchedVehicleDetails,
          });
        }
      }
    });
    let usersHitList = {
      LprList: usersHitLprVinList,
      directList: usersHitDirectVinList,
    };

    return usersHitList;
  };

  const getDriveTimeHours = async (extraWhere, dateObj, reportType, company) => {
    const sql = `
      SELECT
        st.id as shift_time_id,
        concat(u.first_name, ' ', u.last_name) as employee_name,
        u.id as employee_id,
        st.start_time as start_shift,
        st.end_time as end_shift,
        st.shift_type
      FROM shift_times st
      INNER JOIN users u ON st.user_id=u.id
      INNER JOIN branches b ON u.branch_id=b.id
      WHERE
        start_time>=:start AND start_time<=:end ${extraWhere || ''}
      ORDER BY shift_time_id DESC;
    `;

    const branch_result = await db[`${company.dbName}_sequelize`].query(sql, {
      replacements: {
        start: moment(`${dateObj.start} 00:00:00`).add(dateObj.timezoneOffset, 'hours').format(),
        end: moment(`${dateObj.end} 23:59:59`).add(dateObj.timezoneOffset, 'hours').format(),
      },
      type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
    });

    const shift_time_ids = map(branch_result, 'shift_time_id');

    if (shift_time_ids.length) {
      const sql2 = `
        SELECT id, shift_time_id, type, start_time, end_time,
          TIMESTAMPDIFF(SECOND, start_time, end_time) AS timediff
        FROM break_times
        WHERE shift_time_id IN (:shift_time_ids) AND end_time is not NULL
        ORDER BY created_at ASC
      `;

      const break_times = await db[`${company.dbName}_sequelize`].query(sql2, {
        replacements: {
          shift_time_ids: shift_time_ids.length ? shift_time_ids : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      });

      if (branch_result.length) {
        await Promise.all(
          map(branch_result, async (item) => {
            const _breaks = filter(break_times, {
              type: BREAK_TIME_TYPES.break,
              shift_time_id: item.shift_time_id,
            });
            const _pauses = filter(break_times, {
              type: BREAK_TIME_TYPES.pause,
              shift_time_id: item.shift_time_id,
            });
            const _idles = filter(break_times, {
              type: BREAK_TIME_TYPES.idle,
              shift_time_id: item.shift_time_id,
            });

            // const drivingSessions = await DrivingSession.findAll({
            //   where: {
            //     shiftTimeId: item.shift_time_id
            //   }
            // });

            // let totalDrivingSeconds = 0;
            // drivingSessions.map(drivingSession => {
            //   totalDrivingSeconds += Utils.timeDiffAsSeconds(
            //     drivingSession["end_driving_session_time"] || moment(),
            //     drivingSession["start_driving_session_time"]
            //   );
            // });

            // item["total_seconds"] = totalDrivingSeconds;

            if (reportType !== 'daily') {
              item['break_total'] = sumBy(_breaks, (b) => b.timediff);
              item['pause_total'] = sumBy(_pauses, (b) => b.timediff);
              item['idle_total'] = sumBy(_idles, (b) => b.timediff);
              if (item['idle_total'] < 0) item['idle_total'] = 0;

              item['total_seconds'] -= item['break_total'] - item['pause_total'] - item['idle_total'];
            } else {
              item['break_total_seconds'] = sumBy(_breaks, (b) => b.timediff);
              item['pause_total_seconds'] = sumBy(_pauses, (b) => b.timediff);
              item['idle_total_seconds'] = sumBy(_idles, (b) => b.timediff);
              if (item['idle_total_seconds'] < 0) item['idle_total_seconds'] = 0;

              item['driving_total_seconds'] =
                item['total_seconds'] -
                item['break_total_seconds'] -
                item['pause_total_seconds'] -
                item['idle_total_seconds'];

              item['break_total'] = Utils.nonZeroSec2time(item['break_total_seconds']);
              item['pause_total'] = Utils.nonZeroSec2time(item['pause_total_seconds']);
              item['idle_total'] = Utils.nonZeroSec2time(item['idle_total_seconds']);
              item['driving_total'] = Utils.nonZeroSec2time(item['driving_total_seconds']);
            }
            if (reportType !== 'stats') {
              item['total'] = Utils.nonZeroSec2time(item['total_seconds']);
            } else {
              item['driving_total'] = item['total_seconds'];
            }
          }),
        );
      }
      return branch_result;
    }
  };

  const getMissedRepossessedClientList = async (company, branchId, user, dateRange, previousType) => {
    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const missedRepossessedByCountSql = `
    SELECT
      c.case_id,
      c.lender_client_id as id,
      c.lender_client_name as name,
      confirmedNotRepossessedByBranchResult.count as branchCount,
      confirmedNotRepossessedByClientsResult.count as clientsCount
    FROM
      cases c
    LEFT JOIN
    (
      SELECT
        case_id,
        spotted_branch_id as spottedBranchId,
        Count(*) as count
      FROM 
        cases
      WHERE
        status in (:statuses) AND
        (
          (
            spotted_date >=:start AND
            spotted_date <=:end
          )
          OR
          (
            spotted_date >=:start AND
            spotted_date <=:end
          )
        ) AND
        spotted_date is not null
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND spotted_branch_id in (:spottedBranchIds)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
            : ``
        }
      GROUP BY
        spotted_branch_id
    ) as confirmedNotRepossessedByBranchResult
    ON confirmedNotRepossessedByBranchResult.case_id=c.case_id
    LEFT JOIN
    (
      SELECT
        case_id,
        spotted_branch_id as vendorBranchName,
        Count(*) as count
      FROM 
        cases
      WHERE
        status in (:statuses) AND
        (
          (
            spotted_date >=:start AND
            spotted_date <=:end
          )
          OR
          (
            spotted_date >=:start AND
            spotted_date <=:end
          )
        ) AND
        spotted_date is not null
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND spotted_branch_id in (:spottedBranchIds)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
            : ``
        }
      GROUP BY
        lender_client_id
    ) as confirmedNotRepossessedByClientsResult
    ON confirmedNotRepossessedByClientsResult.case_id=c.case_id
    WHERE
      c.status in (:statuses) AND
      (
        (
          c.spotted_date >=:start AND
          c.spotted_date <=:end
        )
        OR
        (
          c.spotted_date >=:start AND
          c.spotted_date <=:end
        )
      ) AND
      c.spotted_date is not null
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
    `;

    const missedRepossessedDetailsSql = `
    SELECT
      c.status,
      c.spotted_branch_id, c.close_date, c.hold_date, c.lender_client_Id as id, c.spotted_address as address,
      c.vin as name, c.spotted_date as date, c.lender_client_name, c.year_make_model, c.vendor_address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id, 
      c.spotter_id,
      u.first_name as spotter_first_name,
      u.last_name as spotter_last_name,
      u.avatar_url as spotter_avatar_url,
      b.name as spotter_branch_name
    FROM 
      branches b,
      cases c
    INNER JOIN
      users u
    ON u.id=c.spotter_id
    WHERE
      c.status in (:statuses) AND
      (
        (
          c.spotted_date >=:start AND
          c.spotted_date <=:end
        )
        OR
        (
          c.spotted_date >=:start AND
          c.spotted_date <=:end
        )
      ) AND
      c.spotted_date is not null AND
      u.branch_id=b.id
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      ORDER BY
        c.spotted_date DESC
    `;

    const currentMonthreplacements = {
      start: moment(dateRange.start).startOf('day').add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours').format(),
      end: moment(dateRange.end).endOf('day').add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours').format(),
      statuses: [
        CASE_STATUSES.closed,
        CASE_STATUSES.pending_close,
        CASE_STATUSES.onHold,
        CASE_STATUSES.pending_on_hold,
      ],
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    const previousMonthreplacements = {
      start: moment(dateRange.start)
        .subtract(1, previousType)
        .startOf('day')
        .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
        .format(),
      end: moment(dateRange.end)
        .subtract(1, previousType)
        .endOf('day')
        .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
        .format(),
      statuses: [
        CASE_STATUSES.closed,
        CASE_STATUSES.pending_close,
        CASE_STATUSES.onHold,
        CASE_STATUSES.pending_on_hold,
      ],
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };

    let [missedRepossessedTotalCases, missedRepossessedByDetailsCases, previousDayMissedRepossessedCases] =
      await Promise.all([
        db[`${company.dbName}_sequelize`].query(missedRepossessedByCountSql, {
          replacements: {
            ...currentMonthreplacements,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
        db[`${company.dbName}_sequelize`].query(missedRepossessedDetailsSql, {
          replacements: {
            ...currentMonthreplacements,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
        db[`${company.dbName}_sequelize`].query(missedRepossessedByCountSql, {
          replacements: {
            ...previousMonthreplacements,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      ]);

    let missedRepossessedValue = 0;
    let missedRepossessedPreviousValue = 0;
    missedRepossessedTotalCases.map((missedRepossessedTotalCase) => {
      if (missedRepossessedTotalCase.branchCount) {
        missedRepossessedValue += JSON.parse(missedRepossessedTotalCase.branchCount);
      }
    });

    previousDayMissedRepossessedCases.map((previousDayMissedRepossessedCase) => {
      if (previousDayMissedRepossessedCase.branchCount) {
        missedRepossessedPreviousValue += JSON.parse(previousDayMissedRepossessedCase.branchCount);
      }
    });

    let missedRepossessedValues = {
      value: missedRepossessedValue,
      previousValue: missedRepossessedPreviousValue,
    };
    if (missedRepossessedValue === 0 && missedRepossessedPreviousValue === 0) {
      missedRepossessedValues = {
        ...missedRepossessedValues,
        percentage: 0,
      };
    } else if (missedRepossessedValue !== 0 && missedRepossessedPreviousValue === 0) {
      missedRepossessedValues = {
        ...missedRepossessedValues,
        percentage: 100,
      };
    } else {
      missedRepossessedValues = {
        ...missedRepossessedValues,
        percentage: Utils.calculatePercentage(missedRepossessedValue, missedRepossessedPreviousValue),
      };
    }
    const clientsDetails = [];
    missedRepossessedTotalCases.map((missedRepossessedCase) => {
      if (missedRepossessedCase.clientsCount) {
        const previousDayCase = find(
          previousDayMissedRepossessedCases,
          (previousDayConfirmedNotRepossessedCase) =>
            previousDayConfirmedNotRepossessedCase.id === missedRepossessedCase.id,
        );

        let clients = {
          id: missedRepossessedCase.id,
          name: missedRepossessedCase.name,
          value: missedRepossessedCase.clientsCount,
          previousValue: previousDayCase ? previousDayCase.clientsCount : 0,
        };
        clients['percentage'] =
          clients.previousValue !== 0 ? Utils.calculatePercentage(clients.value, clients.previousValue) : 100;

        const caseDetails = missedRepossessedByDetailsCases.filter((missedRepossessedByDetailsCase) => {
          return missedRepossessedCase.id === missedRepossessedByDetailsCase.id;
        });

        if (caseDetails.length) {
          clientsDetails.push({
            ...clients,
            details: caseDetails,
          });
        }
      }
    });

    missedRepossessedValues = {
      ...missedRepossessedValues,
      clients: clientsDetails,
    };
    return missedRepossessedValues;
  };

  const getConfirmedNotRepossessedClientList = async (company, branchId, user, dateRange, timezoneOffset) => {
    const spottedBranchIds = await getSpottedBranchIds(company, user, branchId);

    const spottedCasesByCountSql = `
    SELECT
      c.case_id,
      c.lender_client_id as id,
      c.lender_client_name as name,
      spottedCasesByClientsResult.count as clientsCount
    FROM
      cases c
    LEFT JOIN
    (
      SELECT
        case_id,
        spotted_branch_id as spottedBranchId,
        Count(*) as count
      FROM 
        cases
      WHERE
        status in (:status) AND
        spotted_date <=:end AND
        spotted_date is not null
        ${
          (branchId !== COMPANY_WIDE_BRANCH_ID &&
            branchId !== UNKNOWN_BRANCH_ID &&
            user.role.role === SUPER_ADMIN_ROLE) ||
          user.role.role !== SUPER_ADMIN_ROLE
            ? `AND spotted_branch_id in (:spottedBranchIds)`
            : ``
        }
        ${
          branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
            ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
            : ``
        }
      GROUP BY
        lender_client_id
    ) as spottedCasesByClientsResult
    ON spottedCasesByClientsResult.case_id=c.case_id
    WHERE
      c.status in (:status) AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
    ORDER BY
      spottedCasesByClientsResult.count desc
    `;

    const vehicleDetailsSql = `
    SELECT
      c.status,
      c.spotted_branch_id, c.lender_client_Id as id, c.vendor_address, c.spotted_date as date,
      c.vin as name, c.lender_client_name, c.year_make_model, c.spotted_address as address,
      c.vehicle_color, c.vehicle_license_number, c.vehicle_license_state, c.case_id, 
      user_branch_result.user_id,
      user_branch_result.first_name,
      user_branch_result.last_name,
      user_branch_result.avatar_url,
      user_branch_result.branch_name
    FROM 
      cases c
    LEFT JOIN
      (
        SELECT 
          u.id as user_id,
          u.rdn_id,
          u.first_name,
          u.last_name,
          u.avatar_url,
          b.name as branch_name
        FROM 
          users u,
          branches b
        WHERE
          b.id=u.branch_id
      ) as user_branch_result
    ON user_branch_result.user_id=c.spotter_id
    WHERE
      c.status in (:status) AND
      c.spotted_date <=:end AND
      c.spotted_date is not null
      ${
        (branchId !== COMPANY_WIDE_BRANCH_ID &&
          branchId !== UNKNOWN_BRANCH_ID &&
          user.role.role === SUPER_ADMIN_ROLE) ||
        user.role.role !== SUPER_ADMIN_ROLE
          ? `AND spotted_branch_id in (:spottedBranchIds)`
          : ``
      }
      ${
        branchId === UNKNOWN_BRANCH_ID && user.role.role === SUPER_ADMIN_ROLE
          ? `AND (spotted_branch_id is null OR spotted_branch_id not in (:subBranches))`
          : ``
      }
      ORDER BY
        c.spotted_date DESC
    `;

    const currentDayreplacements = {
      end: moment(dateRange.end)
        .add(1, 'days')
        .add(timezoneOffset + SPOTTED_TO_TIME, 'hours')
        .format('YYYY-MM-DD HH:mm:ss'),
      status: [CASE_STATUSES.open, CASE_STATUSES.need_info],
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };
    const previousDayreplacements = {
      end: moment(dateRange.end)
        .add(timezoneOffset + SPOTTED_TO_TIME, 'hours')
        .format('YYYY-MM-DD HH:mm:ss'),
      status: [CASE_STATUSES.open, CASE_STATUSES.need_info],
      spottedBranchIds: spottedBranchIds && spottedBranchIds.length ? spottedBranchIds : [''],
      subBranches: Utils.__SUB_BRANCHES_IDS__[company.dbName],
    };
    let [spottedCases, spottedClientsDetails, previousDaySpottedCases] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(spottedCasesByCountSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(vehicleDetailsSql, {
        replacements: {
          ...currentDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(spottedCasesByCountSql, {
        replacements: {
          ...previousDayreplacements,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const spottedCasesClients = [];
    spottedCases.map((spottedCase) => {
      if (spottedCase.clientsCount) {
        const previousDayCase = find(
          previousDaySpottedCases,
          (previousDaySpottedCase) => previousDaySpottedCase.id === spottedCase.id,
        );

        let clients = {
          id: spottedCase.id,
          name: spottedCase.name,
          value: spottedCase.clientsCount,
          previousValue: previousDayCase ? previousDayCase.clientsCount : 0,
        };
        clients['percentage'] =
          clients.previousValue !== 0 ? Utils.calculatePercentage(clients.value, clients.previousValue) : 100;

        const matchedClientDetails = spottedClientsDetails.filter((spottedClientDetails) => {
          return spottedCase.id === spottedClientDetails.id;
        });
        if (matchedClientDetails.length) {
          spottedCasesClients.push({
            ...clients,
            details: matchedClientDetails,
          });
        }
      }
    });

    return spottedCasesClients;
  };

  const getsecuredHitsByRank = async (company, reqData, byUser = false) => {
    const cameraHitsListSql = `
  SELECT result.*,name as branchName  FROM
	  (SELECT
        camera_hits.drn_id as drn_id,
        camera_hits.lpr_vins,
        camera_hits.direct_hits_vins,
        users.id as id,
        users.first_name as firstName,
        users.last_name as lastName,
        users.branch_id as branch_id,
        users.avatar_url as avatarUrl
        ${byUser ? `,camera_hits.scanned_at` : ``}
      FROM
        rra_db.camera_hits
      INNER JOIN
        rra_db.users
      ON
        camera_hits.drn_id=users.drn_id ${byUser ? `AND users.id=:userId` : ``}
      WHERE
        camera_hits.scanned_at>=:start AND camera_hits.scanned_at<=:end
      ) as result
      LEFT JOIN 
        rra_db.branches
      ON result.branch_id = branches.id
      ${
        byUser
          ? ` GROUP BY
        camera_hits.scanned_at
        ORDER BY
        camera_hits.scanned_at`
          : ``
      }
    `;

    let [currentPeriodCameraHitsList, previousPeriodCameraHitsList] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraHitsListSql, {
        replacements: {
          start: reqData.dateStart,
          end: reqData.dateEnd,
          userId: reqData.userId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraHitsListSql, {
        replacements: {
          start: reqData.previousDateStart,
          end: reqData.previousDateEnd,
          userId: reqData.userId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    let currentPeriodCameraLprVins = map(
      currentPeriodCameraHitsList,
      (currentPeriodCameraHit) => currentPeriodCameraHit.lpr_vins,
    );
    let currentPeriodCameraDirectVins = map(
      currentPeriodCameraHitsList,
      (currentPeriodCameraHit) => currentPeriodCameraHit.direct_hits_vins,
    );
    currentPeriodCameraLprVins = currentPeriodCameraLprVins.filter((currentPeriodCameraLprVin) => {
      return currentPeriodCameraLprVin;
    });
    currentPeriodCameraDirectVins = currentPeriodCameraDirectVins.filter((currentPeriodCameraDirectVin) => {
      return currentPeriodCameraDirectVin;
    });
    let currentPeriodCameraLprVinsList = [];
    currentPeriodCameraLprVins.map((currentPeriodCameraLprVin) => {
      currentPeriodCameraLprVin = currentPeriodCameraLprVin.replace('[', '');
      currentPeriodCameraLprVin = currentPeriodCameraLprVin.replace(']', '');
      currentPeriodCameraLprVin = currentPeriodCameraLprVin.replace(/"/g, '');
      currentPeriodCameraLprVin = currentPeriodCameraLprVin.split(',');
      currentPeriodCameraLprVin.map((lprVin) => {
        currentPeriodCameraLprVinsList.push(lprVin);
      });
    });
    let currentPeriodCameraDirectVinsList = [];
    currentPeriodCameraDirectVins.map((currentPeriodCameraDirectVin) => {
      currentPeriodCameraDirectVin = currentPeriodCameraDirectVin.replace('[', '');
      currentPeriodCameraDirectVin = currentPeriodCameraDirectVin.replace(']', '');
      currentPeriodCameraDirectVin = currentPeriodCameraDirectVin.replace(/"/g, '');
      currentPeriodCameraDirectVin = currentPeriodCameraDirectVin.split(',');
      currentPeriodCameraDirectVin.map((directVin) => {
        currentPeriodCameraDirectVinsList.push(directVin);
      });
    });
    currentPeriodCameraLprVinsList = uniq(currentPeriodCameraLprVinsList);
    currentPeriodCameraDirectVinsList = uniq(currentPeriodCameraDirectVinsList);

    let previousPeriodCameraLprVins = map(
      previousPeriodCameraHitsList,
      (previousPeriodCameraHit) => previousPeriodCameraHit.lpr_vins,
    );
    let previousPeriodCameraDirectVins = map(
      previousPeriodCameraHitsList,
      (previousPeriodCameraHit) => previousPeriodCameraHit.direct_hits_vins,
    );
    previousPeriodCameraLprVins = previousPeriodCameraLprVins.filter((previousPeriodCameraLprVin) => {
      return previousPeriodCameraLprVin;
    });
    previousPeriodCameraDirectVins = previousPeriodCameraDirectVins.filter((previousPeriodCameraDirectVin) => {
      return previousPeriodCameraDirectVin;
    });
    let previousPeriodCameraLprVinsList = [];
    previousPeriodCameraLprVins.map((previousPeriodCameraLprVin) => {
      previousPeriodCameraLprVin = previousPeriodCameraLprVin.replace('[', '');
      previousPeriodCameraLprVin = previousPeriodCameraLprVin.replace(']', '');
      previousPeriodCameraLprVin = previousPeriodCameraLprVin.replace(/"/g, '');
      previousPeriodCameraLprVin = previousPeriodCameraLprVin.split(',');
      previousPeriodCameraLprVin.map((lprVin) => {
        previousPeriodCameraLprVinsList.push(lprVin);
      });
    });
    let previousPeriodCameraDirectVinsList = [];
    previousPeriodCameraDirectVins.map((previousPeriodCameraDirectVin) => {
      previousPeriodCameraDirectVin = previousPeriodCameraDirectVin.replace('[', '');
      previousPeriodCameraDirectVin = previousPeriodCameraDirectVin.replace(']', '');
      previousPeriodCameraDirectVin = previousPeriodCameraDirectVin.replace(/"/g, '');
      previousPeriodCameraDirectVin = previousPeriodCameraDirectVin.split(',');
      previousPeriodCameraDirectVin.map((directVin) => {
        previousPeriodCameraDirectVinsList.push(directVin);
      });
    });
    previousPeriodCameraLprVinsList = uniq(previousPeriodCameraLprVinsList);
    previousPeriodCameraDirectVinsList = uniq(previousPeriodCameraDirectVinsList);
    let currentPeriodCameraVinsList = [...currentPeriodCameraLprVinsList, ...currentPeriodCameraDirectVinsList];
    currentPeriodCameraVinsList = uniq(currentPeriodCameraVinsList);
    let previousPeriodCameraVinsList = [...previousPeriodCameraDirectVinsList, ...previousPeriodCameraLprVinsList];
    previousPeriodCameraVinsList = uniq(previousPeriodCameraVinsList);

    const directSecuredListSql = `
    select * FROM
    (
      SELECT
        *, RIGHT(vin, 8) as lastVinNumber
      FROM
        cases
      WHERE
        status='${CASE_STATUSES.repossessed}' 
    ) as repossessedCases
    Where repossessedCases.lastVinNumber in (:vins)
  `;

    let [currentPeriodDirectSecuredList, previousPeriodDirectSecuredList] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(directSecuredListSql, {
        replacements: {
          vins: currentPeriodCameraVinsList.length ? currentPeriodCameraVinsList : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(directSecuredListSql, {
        replacements: {
          vins: previousPeriodCameraVinsList.length ? previousPeriodCameraVinsList : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const currentPeriodDirectHitsVinNumbers = map(
      currentPeriodDirectSecuredList,
      (directSecured) => directSecured.lastVinNumber,
    );
    const currentPeriodCameraHits = [];
    currentPeriodCameraHitsList.map((currentPeriodCameraHit) => {
      const index = currentPeriodCameraHits.findIndex((currentPeriodCameraHitData) =>
        byUser
          ? currentPeriodCameraHitData.scanned_at === currentPeriodCameraHit.scanned_at
          : currentPeriodCameraHitData.drn_id === currentPeriodCameraHit.drn_id,
      );
      let securedCount = 0;
      if (index > -1) {
        securedCount = currentPeriodCameraHits[index].directSecuredCount;
      }
      if (currentPeriodDirectHitsVinNumbers.length) {
        currentPeriodDirectHitsVinNumbers.map((vinNumber) => {
          if (
            currentPeriodCameraHit.direct_hits_vins &&
            currentPeriodCameraHit.direct_hits_vins.includes(vinNumber)
          ) {
            securedCount++;
          }
        });
      }
      currentPeriodCameraHit.directSecuredCount = securedCount;
      securedCount = 0;
      currentPeriodCameraHit.lprSecuredCount = securedCount;
      currentPeriodCameraHit.securedCount =
        (currentPeriodCameraHit.directSecuredCount || 0) + (currentPeriodCameraHit.lprSecuredCount || 0);

      if (index > -1) {
        currentPeriodCameraHits[index] = currentPeriodCameraHit;
      } else {
        currentPeriodCameraHits.push(currentPeriodCameraHit);
      }
    });
    currentPeriodCameraHits.sort(function (a, b) {
      return b.securedCount - a.securedCount;
    });

    const previousPeriodDirectHitsVinNumbers = map(
      previousPeriodDirectSecuredList,
      (directSecured) => directSecured.lastVinNumber,
    );

    const previousPeriodCameraHits = [];
    previousPeriodCameraHitsList.map((previousPeriodCameraHit) => {
      const index = previousPeriodCameraHits.findIndex((previousPeriodCameraHitData) =>
        byUser
          ? previousPeriodCameraHitData.scanned_at === previousPeriodCameraHit.scanned_at
          : previousPeriodCameraHitData.drn_id === previousPeriodCameraHit.drn_id,
      );
      let securedCount = 0;
      if (index > -1) {
        securedCount = previousPeriodCameraHits[index].directSecuredCount;
      }
      if (previousPeriodDirectHitsVinNumbers.length) {
        previousPeriodDirectHitsVinNumbers.map((vinNumber) => {
          if (
            previousPeriodCameraHit.direct_hits_vins &&
            previousPeriodCameraHit.direct_hits_vins.includes(vinNumber)
          ) {
            securedCount++;
          }
          previousPeriodCameraHit.directSecuredCount = securedCount;
        });
      }
      previousPeriodCameraHit.directSecuredCount = securedCount;
      securedCount = 0;
      previousPeriodCameraHit.lprSecuredCount = securedCount;
      previousPeriodCameraHit.securedCount =
        previousPeriodCameraHit.directSecuredCount + (previousPeriodCameraHit.lprSecuredCount || 0);
      if (index > -1) {
        previousPeriodCameraHits[index] = previousPeriodCameraHit;
      } else {
        previousPeriodCameraHits.push(previousPeriodCameraHit);
      }
    });
    previousPeriodCameraHitsList.sort(function (a, b) {
      return b.securedCount - a.securedCount;
    });

    const securedHitsByRank = currentPeriodCameraHits.map((securedHit, i) => {
      {
        !byUser && (securedHit.rank = i + 1);
      }
      let rankOnPrevPeriod;
      {
        byUser
          ? (rankOnPrevPeriod = findIndex(
              previousPeriodCameraHitsList,
              (pCamera) =>
                moment(securedHit.scanned_at).format('YYYY-MM-DD') ===
                moment(pCamera.scanned_at).format('YYYY-MM-DD'),
            ))
          : (rankOnPrevPeriod = findIndex(
              previousPeriodCameraHits,
              (pCamera) => securedHit.drn_id === pCamera.drn_id,
            ));
      }

      if (rankOnPrevPeriod > -1) {
        if (i < rankOnPrevPeriod) {
          securedHit.status = 1;
        } else if (i === rankOnPrevPeriod) {
          securedHit.status = 0;
        } else {
          securedHit.status = -1;
        }
      } else {
        securedHit.status = 1;
      }
      return securedHit;
    });
    return securedHitsByRank;
  };

  const getCameraScans = async (company, reqData) => {
    const cameraScansSql = `
    SELECT result.*,name as branchName  FROM 
      (
        SELECT
          camera_scans.drn_id as drn_id,
          users.id as id,
          users.first_name as firstName,
          users.last_name as lastName,
          users.branch_id as branch_id,
          SUM(camera_scans.count) as count,
          users.avatar_url as avatarUrl
        FROM
          camera_scans
        LEFT JOIN
          users
        ON
          camera_scans.drn_id=users.drn_id
        WHERE
          camera_scans.scanned_at>=:start AND camera_scans.scanned_at<=:end
        GROUP BY
          camera_scans.drn_id) as result
        LEFT JOIN 
          branches
        ON result.branch_id = branches.id
        ORDER BY
          count DESC`;
    let [currentPeriodCameraScans, previousPeriodCameraScans] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraScansSql, {
        replacements: {
          start: reqData.dateStart,
          end: reqData.dateEnd,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraScansSql, {
        replacements: {
          start: reqData.previousDateStart,
          end: reqData.previousDateEnd,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const cameraScansByRank = currentPeriodCameraScans.map((cCamera, i) => {
      cCamera.rank = i + 1;
      const rankOnPrevPeriod = findIndex(
        previousPeriodCameraScans,
        (pCamera) => cCamera.drn_id === pCamera.drn_id,
      );
      if (rankOnPrevPeriod > -1) {
        if (i < rankOnPrevPeriod) {
          cCamera.status = 1;
        } else if (i === rankOnPrevPeriod) {
          cCamera.status = 0;
        } else {
          cCamera.status = -1;
        }
      } else {
        cCamera.status = 1;
      }
      return cCamera;
    });
    return cameraScansByRank;
  };

  const getCameraHits = async (company, reqData, byUser = false) => {
    const cameraHitsSql = `
  SELECT result.*,name as branchName  FROM
		(SELECT
        camera_hits.drn_id as drn_id,
        users.id as id,
        users.first_name as firstName,
        users.last_name as lastName,
        users.branch_id as branch_id,
        SUM(camera_hits.lpr) as lprCount,
        SUM(camera_hits.direct) as directCount,
        SUM(camera_hits.count) as totalCount,
        users.avatar_url as avatarUrl
        ${byUser ? `,camera_hits.scanned_at` : ``}
      FROM
		    camera_hits
      LEFT JOIN
        users
      ON
        camera_hits.drn_id=users.drn_id ${byUser ? `AND users.id=:userId` : ``}
      WHERE
        camera_hits.scanned_at>=:start AND camera_hits.scanned_at<=:end
      GROUP BY ${byUser ? `camera_hits.scanned_at` : `camera_hits.drn_id`}) as result
      LEFT JOIN 
        branches
      ON result.branch_id = branches.id
      ORDER BY
      ${byUser ? `camera_hits.scanned_at` : `totalCount DESC, lprCount DESC, directCount DESC`}
    `;

    let [currentPeriodCameraHits, previousPeriodCameraHits] = await Promise.all([
      db[`${company.dbName}_sequelize`].query(cameraHitsSql, {
        replacements: {
          start: reqData.dateStart,
          end: reqData.dateEnd,
          userId: reqData.userId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
      db[`${company.dbName}_sequelize`].query(cameraHitsSql, {
        replacements: {
          start: reqData.previousDateStart,
          end: reqData.previousDateEnd,
          userId: reqData.userId,
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    const cameraHitsByRank = currentPeriodCameraHits.map((cameraLprHits, i) => {
      {
        !byUser && (cameraLprHits.rank = i + 1);
      }
      let rankOnPrevPeriod;
      {
        byUser
          ? (rankOnPrevPeriod = findIndex(
              previousPeriodCameraHits,
              (pCamera) =>
                moment(cameraLprHits.scanned_at).format('YYYY-MM-DD') ===
                moment(pCamera.scanned_at).format('YYYY-MM-DD'),
            ))
          : (rankOnPrevPeriod = findIndex(
              previousPeriodCameraHits,
              (pCamera) => cameraLprHits.drn_id === pCamera.drn_id,
            ));
      }

      if (rankOnPrevPeriod > -1) {
        if (i < rankOnPrevPeriod) {
          cameraLprHits.status = 1;
        } else if (i === rankOnPrevPeriod) {
          cameraLprHits.status = 0;
        } else {
          cameraLprHits.status = -1;
        }
      } else {
        cameraLprHits.status = 1;
      }
      return cameraLprHits;
    });
    return cameraHitsByRank;
  };

  const getCamerasByRank = async (company, reqData) => {
    reqData.dateStart = moment(`${reqData.dateStart} 00:00:00`).format('YYYY-MM-DD');
    reqData.dateEnd = moment(`${reqData.dateEnd} 23:59:59`).format('YYYY-MM-DD');
    reqData.previousDateStart = moment(`${reqData.dateStart} 00:00:00`).subtract(1, 'years').format('YYYY-MM-DD');
    reqData.previousDateEnd = moment(`${reqData.dateEnd} 23:59:59`).subtract(1, 'years').format('YYYY-MM-DD');

    const securedHitsByRank = await getsecuredHitsByRank(company, reqData);

    const cameraScansByRank = await getCameraScans(company, reqData);

    const cameraHitsByRank = await getCameraHits(company, reqData);

    const mainBranches = values(Utils.getMainBranches(company.dbName));
    const cameraCarsByBranch = {};

    mainBranches.map((mainBranch) => {
      cameraCarsByBranch[mainBranch] = {
        ...cameraCarsByBranch[mainBranch],
        [SCANNED]:
          mainBranch === COMPANY_WIDE
            ? cameraScansByRank
            : cameraScansByRank.filter((cameraScan) => {
                return cameraScan.branchName === mainBranch;
              }),
        [SECURED]:
          mainBranch === COMPANY_WIDE
            ? securedHitsByRank
            : securedHitsByRank.filter((securedHit) => {
                return securedHit.branchName === mainBranch;
              }),
        [ALL_HITS]:
          mainBranch === COMPANY_WIDE
            ? cameraHitsByRank
            : cameraHitsByRank.filter((cameraCountHit) => {
                return cameraCountHit.branchName === mainBranch;
              }),
      };
    });
    return cameraCarsByBranch;
  };

  const getMTDYTDClientsStasCustom = async (date, Case, company, dateStart = null, dateEnd = null) => {
    // const serverTime = await systemService().getServerTime(company.dbName);
    const mtdStart = `${moment(date).format('YYYY-MM')}-01`;
    const ytdStart = `${moment(date).format('YYYY')}-01-01`;
    const dateQuery = {
      mtd: {
        [Sequelize.Op.gte]: moment(`${mtdStart} 00:00:00`)
          .startOf('day')
          .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
          .format(),
        [Sequelize.Op.lte]: moment(`${date} 23:59:59`)
          .endOf('day')
          .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
          .format(),
      },
      ytd: {
        [Sequelize.Op.gte]: moment(`${ytdStart} 00:00:00`)
          .startOf('day')
          .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
          .format(),
        [Sequelize.Op.lte]: moment(`${date} 23:59:59`)
          .endOf('day')
          .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
          .format(),
      },
    };

    let CustomClientsAssignments = {};
    let CustomClientsRepossessions = {};
    let CustomClientsMissedRepossessions = {};

    if (dateStart !== null && dateEnd !== null) {
      dateQuery.custom = {
        [Sequelize.Op.gte]: moment(`${dateStart} 00:00:00`)
          .startOf('day')
          .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
          .format(),
        [Sequelize.Op.lte]: moment(`${dateEnd} 23:59:59`)
          .endOf('day')
          .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
          .format(),
      };

      let [TCustomClientsAssignments, TCustomClientsRepossessions, TCustomClientsMissedRepossessions] =
        await Promise.all([
          Case.findAll({
            attributes: [
              [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
              'lenderClientId',
              'lenderClientName',
              'vendorBranchName',
            ],
            where: {
              status: {
                [Sequelize.Op.in]: values(CASE_STATUSES_RDN_MATCH),
              },
              originalOrderDate: dateQuery.custom,
            },
            group: ['lenderClientId', 'vendorBranchName'],
            raw: true,
          }),
          Case.findAll({
            attributes: [
              [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
              'lenderClientId',
              'lenderClientName',
              'repossessedBranchName',
            ],
            where: {
              status: {
                [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
              },
              rdn_repo_date: dateQuery.custom,
            },
            group: ['lenderClientId', 'repossessedBranchName'],
            raw: true,
          }),
          Case.findAll({
            attributes: [
              [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
              'lenderClientId',
              'lenderClientName',
              'spottedBranchId',
            ],
            where: {
              spottedDate: {
                [Sequelize.Op.not]: null,
              },
              [Sequelize.Op.or]: [
                {
                  status: {
                    [Sequelize.Op.in]: [CASE_STATUSES.pending_close, CASE_STATUSES.closed],
                  },
                  originalCloseDate: dateQuery.custom,
                },
                {
                  status: {
                    [Sequelize.Op.in]: [CASE_STATUSES.pending_on_hold, CASE_STATUSES.onHold],
                  },
                  originalHoldDate: dateQuery.custom,
                },
              ],
            },
            group: ['lenderClientId', 'spottedBranchId'],
            raw: true,
          }),
        ]);

      CustomClientsAssignments = TCustomClientsAssignments;
      CustomClientsRepossessions = TCustomClientsRepossessions;
      CustomClientsMissedRepossessions = TCustomClientsMissedRepossessions;
    }

    const [
      MTDClientsAssignments,
      MTDClientsRepossessions,
      MTDClientsMissedRepossessions,
      YTDClientsAssignments,
      YTDClientsRepossessions,
      YTDClientsMissedRepossessions,
    ] = await Promise.all([
      Case.findAll({
        attributes: [
          [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
          'lenderClientId',
          'lenderClientName',
          'vendorBranchName',
        ],
        where: {
          status: {
            [Sequelize.Op.in]: values(CASE_STATUSES_RDN_MATCH),
          },
          originalOrderDate: dateQuery.mtd,
        },
        group: ['lenderClientId', 'vendorBranchName'],
        raw: true,
      }),
      Case.findAll({
        attributes: [
          [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
          'lenderClientId',
          'lenderClientName',
          'repossessedBranchName',
        ],
        where: {
          status: {
            [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
          },
          rdn_repo_date: dateQuery.mtd,
        },
        group: ['lenderClientId', 'repossessedBranchName'],
        raw: true,
      }),
      Case.findAll({
        attributes: [
          [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
          'lenderClientId',
          'lenderClientName',
          'spottedBranchId',
        ],
        where: {
          spottedDate: {
            [Sequelize.Op.not]: null,
          },
          [Sequelize.Op.or]: [
            {
              status: {
                [Sequelize.Op.in]: [CASE_STATUSES.pending_close, CASE_STATUSES.closed],
              },
              originalCloseDate: dateQuery.mtd,
            },
            {
              status: {
                [Sequelize.Op.in]: [CASE_STATUSES.pending_on_hold, CASE_STATUSES.onHold],
              },
              originalHoldDate: dateQuery.mtd,
            },
          ],
        },
        group: ['lenderClientId', 'spottedBranchId'],
        raw: true,
      }),
      Case.findAll({
        attributes: [
          [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
          'lenderClientId',
          'lenderClientName',
          'vendorBranchName',
        ],
        where: {
          status: {
            [Sequelize.Op.in]: values(CASE_STATUSES_RDN_MATCH),
          },
          originalOrderDate: dateQuery.ytd,
        },
        group: ['lenderClientId', 'vendorBranchName'],
        raw: true,
      }),
      Case.findAll({
        attributes: [
          [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
          'lenderClientId',
          'lenderClientName',
          'repossessedBranchName',
        ],
        where: {
          status: {
            [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
          },
          rdn_repo_date: dateQuery.ytd,
        },
        group: ['lenderClientId', 'repossessedBranchName'],
        raw: true,
      }),
      Case.findAll({
        attributes: [
          [Sequelize.fn('count', Sequelize.col('case_id')), 'count'],
          'lenderClientId',
          'lenderClientName',
          'spottedBranchId',
        ],
        where: {
          spottedDate: {
            [Sequelize.Op.not]: null,
          },
          [Sequelize.Op.or]: [
            {
              status: {
                [Sequelize.Op.in]: [CASE_STATUSES.pending_close, CASE_STATUSES.closed],
              },
              originalCloseDate: dateQuery.ytd,
            },
            {
              status: {
                [Sequelize.Op.in]: [CASE_STATUSES.pending_on_hold, CASE_STATUSES.onHold],
              },
              originalHoldDate: dateQuery.ytd,
            },
          ],
        },
        group: ['lenderClientId', 'spottedBranchId'],
        raw: true,
      }),
    ]);

    return {
      CustomClientsAssignments,
      CustomClientsRepossessions,
      CustomClientsMissedRepossessions,
      MTDClientsAssignments,
      MTDClientsRepossessions,
      MTDClientsMissedRepossessions,
      YTDClientsAssignments,
      YTDClientsRepossessions,
      YTDClientsMissedRepossessions,
    };
  };

  return {
    sendDailyReportEmailToManagers,
    getDriveTimeHours,
    getDriverReports,
    getShiftAllowedTime,
    getUnitsPendingRepossessions,
    getAssignedClientList,
    getRepossessedClientOrUserList,
    getSpottedClientOrUserList,
    getSpottedNotSecuredClientList,
    getAccountNotCheckedClientList,
    getCheckInsClientList,
    getUserScanList,
    getMissedRepossessedClientList,
    getConfirmedNotRepossessedClientList,
    getNewAssignments,
    getRepossessions,
    getConfirmedNotRepossessedCounts,
    getSpottedCounts,
    getSpottedNotSecuredCounts,
    getCameraScansCounts,
    getRecoveryRatesForDailyReports,
    getAccountNotCheckedCounts,
    getCheckInsCounts,
    getTotalRepossessionsMap,
    getSpottedMap,
    getSpottedNotSecuredMap,
    getServerTime,
    getRepossessionHitListCount,
    getCamerasByRank,
    getsecuredHitsByRank,
    getCameraHits,
    getCameraHitsCounts,
    getUserHitsList,
    getCameraHitsNotSecuredCounts,
    geLiveHitsNotSecuredListByUser,
    getShiftStatistics,
    getMTDYTDClientsStasCustom,
    getSpottedCaseClientOrUserList,
    getCameraCarsHitAndSecuredListByClientOrUser,
  };
};

module.exports = reportService;
