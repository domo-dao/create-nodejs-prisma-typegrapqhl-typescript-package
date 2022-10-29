const httpStatus = require('http-status');
const Sequelize = require('sequelize');
const { find, findIndex, get, forEach, isUndefined } = require('lodash');
const moment = require('moment');

const { PlatformUser, PlatformCompany } = require('../database/models');
const db = require('../database/models');
const {
  YTD,
  WEEK,
  MONTH,
  TODAY,
  TASK_STATUSES,
  BREAK_TIME_TYPES,
  USER_STATUS,
  USER_ACTIVITIES,
  ADMIN_ROLES,
  BRANCH_MANAGER,
  INTRO_VIDEOS,
} = require('../constants/app.constants');
const messageConstants = require('../constants/message.constants');
const {
  CASE_STATUSES,
  CASE_ORDER_TYPES,
  RDN_SERVER_TIME_ZONE_OFFSET,
  VOLUNTARY_ORDER_TYPES,
} = require('../rdn/constants');
const Utils = require('../utils/util');
const tokenService = require('./token.service');
const mailService = require('./mail.service');
const bcryptService = require('./bcrypt.service');
const { emailDomain, emailReplyAddress } = require('../config/vars');
const { serverLogger } = require('../config/logger');

const userService = () => {
  const companyService = require('./company.service');
  const getUserDetails = async (userDetailsFilterOptions, company) => {
    const { User } = await companyService().getCompanyDatabase(company.dbName);
    const dateStart = moment(`${userDetailsFilterOptions.dateStart} 00:00:00`)
      .add(userDetailsFilterOptions.timezoneOffset, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    const dateEnd = moment(`${userDetailsFilterOptions.dateEnd} 23:59:59`)
      .add(userDetailsFilterOptions.timezoneOffset, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    const curentDate = moment().format().substring(0, 10);
    const todayStartDate = moment(`${curentDate} 00:00:00`)
      .add(userDetailsFilterOptions.timezoneOffset, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    const todayEndDate = moment(`${curentDate} 23:59:59`)
      .add(userDetailsFilterOptions.timezoneOffset, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    const previousStartDate = moment(`${userDetailsFilterOptions.previousStartDate} 00:00:00`)
      .add(userDetailsFilterOptions.timezoneOffset, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    const previousEndDate = moment(`${userDetailsFilterOptions.previousEndDate} 23:59:59`)
      .add(userDetailsFilterOptions.timezoneOffset, 'hours')
      .format('YYYY-MM-DD HH:mm:ss');

    const user = await User.findOne({
      where: {
        id: userDetailsFilterOptions.userId,
      },
    });

    if (!user) {
      return {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.USER_DOES_NOT_EXIST,
      };
    }

    let totalUsersByRole,
      currentUserRank,
      driveTimeHoursCount,
      startOnTimePercentage,
      endBeforeTimePercentage,
      avgWorkHoursCount,
      totalWorkHoursCount,
      infractionCount,
      involRepossessionsCount,
      volRepossessedCount,
      spottedVehicleCount,
      commissionCount = null;

    const promises = [];

    if (!totalUsersByRole) {
      const total_users_by_role = `
        SELECT count(*) as count
        FROM
          users
        WHERE
          role_id=:roleId
      `;
      promises.push(
        db[`${company.dbName}_sequelize`].query(total_users_by_role, {
          replacements: {
            roleId: user.roleId,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      promises.push(JSON.parse(totalUsersByRole));
    }

    const drive_time_hours_query = ` SELECT
        st.id as shift_time_id,
        st.manual_count,
        st.shift_id,
        st.user_id,
        u.role_id,
        last_geoLocations_record.id,
        last_geoLocations_record.end_track_time,
        st.start_time,
        TIMESTAMPDIFF(SECOND, st.start_time, 
          IF
          (
            st.end_time is null,
            last_geoLocations_record.end_track_time,
            st.end_time
          )
        ) as time,
        IF(
          (total_non_idle_break_times.break_time_diff is null),
          0,
          total_non_idle_break_times.break_time_diff
        ) as non_idle,
        IF(
          (total_idle_break_times.break_time_diff is null),
          0,
          total_idle_break_times.break_time_diff
        ) as idle,
        SUM
        (
          (
            TIMESTAMPDIFF(SECOND, st.start_time, 
            IF
            (
              st.end_time is null,
              last_geoLocations_record.end_track_time,
              st.end_time
            )
          )
          - 
          IF
            (
              (total_non_idle_break_times.break_time_diff is null),
              0,
              total_non_idle_break_times.break_time_diff
            )
          )
          -
          IF
          (
            (total_idle_break_times.break_time_diff is null),
            0,
            total_idle_break_times.break_time_diff
          )
          -
          st.manual_count
        ) as total_time_diff
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
            type in(:non_idle_types) AND end_time is not NULL
          GROUP BY shift_time_id
          ORDER BY created_at 
        ) as total_non_idle_break_times
        ON st.id = total_non_idle_break_times.shift_time_id
        LEFT JOIN (
          SELECT  shift_time_id, (IF(
            SUM(TIMESTAMPDIFF(SECOND, start_time, end_time)) is null,
            0,
            SUM(TIMESTAMPDIFF(SECOND, start_time, end_time))
          )) as break_time_diff
          FROM break_times
          WHERE
            type=:idle_types AND end_time is not NULL
          GROUP BY shift_time_id
          ORDER BY created_at 
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
        users as u
        WHERE
          st.user_id=u.id AND
          u.role_id = :roleId AND
          st.start_time>=:start AND
          st.start_time<=:end
      GROUP BY st.user_id, st.id`;

    const total_hours_worked_query = ` SELECT
      (SUM(TIMESTAMPDIFF(SECOND, start_time, 
        IF(
        (end_time is null),
        CURRENT_TIMESTAMP,
        end_time
      )))) as totalSeconds, st.user_id, u.role_id
      FROM shift_times st
      INNER JOIN users u ON st.user_id=u.id
      WHERE
        u.role_id =:roleId AND start_time>=:start AND start_time<=:end
      GROUP BY st.user_id`;

    if (!currentUserRank) {
      const task_stats_query = ` SELECT
          count(*) as completed, u.role_id, u.id as user_id FROM tasks t
          INNER JOIN users u ON t.assignee_id=u.id
          WHERE 
            u.role_id =:roleId AND 
            t.status=:status AND
            t.created_at>=:start AND
            t.created_at<=:end 
          GROUP BY u.id`;

      const current_user_rank_query = ` SELECT
          IF(
            (task_stats_result.completed is null),
            0,
            task_stats_result.completed
          ) as a
          ,
          IF(
            (total_hours_worked_result.totalSeconds is null),
            0,
            total_hours_worked_result.totalSeconds
          ) as b
          ,
          IF(
            (drive_time_result.total_time_diff is null),
            0,
            drive_time_result.total_time_diff
          ) as c,
        u.id as user_id
        FROM 
          users u
          LEFT JOIN
          (${task_stats_query}) as task_stats_result
          ON u.id = task_stats_result.user_id
          LEFT JOIN
          (${total_hours_worked_query}) as total_hours_worked_result
          ON u.id = total_hours_worked_result.user_id
          LEFT JOIN
          (${drive_time_hours_query}) as drive_time_result
          ON u.id = drive_time_result.user_id
          WHERE
            u.role_id=:roleId
          ORDER BY
            a desc, b desc, c desc
        `;
      promises.push(
        db[`${company.dbName}_sequelize`].query(current_user_rank_query, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: todayStartDate,
            end: todayEndDate,
            non_idle_types: [BREAK_TIME_TYPES.break, BREAK_TIME_TYPES.pause],
            idle_types: BREAK_TIME_TYPES.idle,
            status: TASK_STATUSES.completed,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      promises.push(JSON.parse(currentUserRank));
    }

    if (!driveTimeHoursCount) {
      const drive_time_hours_rank = `
        SELECT 
          result.total_time_diff,
          FIND_IN_SET( result.total_time_diff, (
            SELECT GROUP_CONCAT( result.total_time_diff
            ORDER BY result.total_time_diff DESC ) 
            FROM (${drive_time_hours_query}) as result )
          ) AS rank
        FROM (${drive_time_hours_query}) as result
        WHERE
          result.user_id=:userId
        ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(drive_time_hours_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
            non_idle_types: [BREAK_TIME_TYPES.break, BREAK_TIME_TYPES.pause],
            idle_types: BREAK_TIME_TYPES.idle,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );

      promises.push(
        db[`${company.dbName}_sequelize`].query(drive_time_hours_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
            non_idle_types: [BREAK_TIME_TYPES.break, BREAK_TIME_TYPES.pause],
            idle_types: BREAK_TIME_TYPES.idle,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      driveTimeHoursCount = JSON.parse(driveTimeHoursCount);
      promises.push([
        {
          total_time_diff: driveTimeHoursCount.currentValue,
          rank: driveTimeHoursCount.rank,
        },
      ]);
      promises.push([{ total_time_diff: driveTimeHoursCount.previousValue }]);
    }

    if (!startOnTimePercentage) {
      const start_on_time_query = ` SELECT (ROUND((c.count * 100) / count(*), 2)) as percentage, st.user_id
      FROM 
        ( SELECT
            count(*) as count, st.user_id
          FROM 
            shift_times st
          INNER JOIN users u ON st.user_id=u.id
          WHERE
            u.role_id = :roleId AND st.start_time <= st.shift_period_start_time AND st.created_at>=:start AND st.created_at<=:end
          GROUP BY st.user_id
        ) as c,
        shift_times as st
        INNER JOIN users u ON st.user_id=u.id
      WHERE
        u.role_id = :roleId AND c.user_id=st.user_id AND st.created_at>=:start AND st.created_at<=:end 
      GROUP BY st.user_id`;

      const start_on_time_rank = `
      SELECT 
        result.percentage,
        FIND_IN_SET( result.percentage, (
          SELECT GROUP_CONCAT( result.percentage
          ORDER BY result.percentage DESC ) 
          FROM (${start_on_time_query}) as result )
        ) AS rank
      FROM (${start_on_time_query}) as result
      WHERE
        result.user_id=:userId
      ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(start_on_time_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(start_on_time_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      startOnTimePercentage = JSON.parse(startOnTimePercentage);
      promises.push([
        {
          percentage: startOnTimePercentage.currentValue,
          rank: startOnTimePercentage.rank,
        },
      ]);
      promises.push([{ percentage: startOnTimePercentage.previousValue }]);
    }

    if (!endBeforeTimePercentage) {
      const end_before_time_query = ` SELECT (ROUND((c.count * 100) / count(*), 2)) as percentage, st.user_id
        FROM 
          ( SELECT
              count(*) as count, st.user_id
            FROM 
              shift_times st
            INNER JOIN users u ON st.user_id=u.id
            WHERE
              u.role_id = :roleId AND st.end_time < st.shift_period_end_time AND st.created_at>=:start AND st.created_at<=:end
            GROUP BY st.user_id
          ) as c,
          shift_times as st
          INNER JOIN users u ON st.user_id=u.id
        WHERE
          u.role_id = :roleId AND c.user_id=st.user_id AND st.created_at>=:start AND st.created_at<=:end 
        GROUP BY st.user_id`;

      const end_before_time_rank = `
        SELECT 
          result.percentage,
          FIND_IN_SET( result.percentage, (
            SELECT GROUP_CONCAT( result.percentage
            ORDER BY result.percentage DESC ) 
            FROM (${end_before_time_query}) as result )
          ) AS rank
        FROM (${end_before_time_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(end_before_time_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(end_before_time_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      endBeforeTimePercentage = JSON.parse(endBeforeTimePercentage);
      promises.push([
        {
          percentage: endBeforeTimePercentage.currentValue,
          rank: endBeforeTimePercentage.rank,
        },
      ]);
      promises.push([{ percentage: endBeforeTimePercentage.previousValue }]);
    }

    if (!avgWorkHoursCount) {
      const types = [
        {
          name: TODAY,
          dateFormat: `DATE_FORMAT( IF(
            (end_time is null),
            CURRENT_TIMESTAMP,
            end_time), '%y-%m-%d')`,
        },
        {
          name: WEEK,
          dateFormat: `DATE_FORMAT( IF(
            (end_time is null),
            CURRENT_TIMESTAMP,
            end_time), '%X %V')`,
        },
        {
          name: MONTH,
          dateFormat: `DATE_FORMAT( IF(
            (end_time is null),
            CURRENT_TIMESTAMP,
            end_time), '%y-%m')`,
        },
        {
          name: YTD,
          dateFormat: `DATE_FORMAT( IF(
            (end_time is null),
            CURRENT_TIMESTAMP,
            end_time), '%y-%m')`,
        },
      ];
      const selectedTypeDateFormat = find(types, (type) => type.name === userDetailsFilterOptions.type);

      const sum_of_hours_of_year_query = ` SELECT
      (SUM(TIMESTAMPDIFF(SECOND, start_time, 
        IF(
        (end_time is null),
        CURRENT_TIMESTAMP,
        end_time
      )))) as totalSeconds, st.user_id, u.role_id
      ${
        selectedTypeDateFormat
          ? `, ${selectedTypeDateFormat.dateFormat}`
          : `, DATE_FORMAT( IF(
            (end_time is null),
            CURRENT_TIMESTAMP,
            end_time
          ), '%y-%m')`
      } as dateFilter
      FROM shift_times st
      INNER JOIN users u ON st.user_id=u.id
      WHERE
        u.role_id =:roleId AND start_time>=:start AND (end_time<=:end OR end_time is null)
      GROUP BY st.user_id, dateFilter`;

      const avg_hours_worked_query = ` SELECT
      AVG(result.totalSeconds) as avgWorkSeconds,
      result.user_id
      FROM (${sum_of_hours_of_year_query}) as result
      GROUP BY result.user_id
      `;

      const avg_hours_worked_rank = `
        SELECT 
          result.avgWorkSeconds,
          FIND_IN_SET( result.avgWorkSeconds, (
            SELECT GROUP_CONCAT( result.avgWorkSeconds
            ORDER BY result.avgWorkSeconds DESC ) 
            FROM (${avg_hours_worked_query}) as result )
          ) AS rank
        FROM (${avg_hours_worked_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(avg_hours_worked_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: moment(dateStart)
              .startOf('year')
              .add(userDetailsFilterOptions.timezoneOffset, 'hours')
              .format('YYYY-MM-DD HH:mm:ss'),
            end: dateEnd,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(avg_hours_worked_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: moment(previousStartDate)
              .startOf('year')
              .add(userDetailsFilterOptions.timezoneOffset, 'hours')
              .format('YYYY-MM-DD HH:mm:ss'),
            end: previousEndDate,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      avgWorkHoursCount = JSON.parse(avgWorkHoursCount);
      promises.push([
        {
          avgWorkSeconds: avgWorkHoursCount.currentValue,
          rank: avgWorkHoursCount.rank,
        },
      ]);
      promises.push([{ avgWorkSeconds: avgWorkHoursCount.previousValue }]);
    }

    if (!totalWorkHoursCount) {
      const total_hours_worked_rank = `
        SELECT 
          result.totalSeconds,
          FIND_IN_SET( result.totalSeconds, (
            SELECT GROUP_CONCAT( result.totalSeconds
            ORDER BY result.totalSeconds DESC ) 
            FROM (${total_hours_worked_query}) as result )
          ) AS rank
        FROM (${total_hours_worked_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(total_hours_worked_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(total_hours_worked_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      totalWorkHoursCount = JSON.parse(totalWorkHoursCount);
      promises.push([
        {
          totalSeconds: totalWorkHoursCount.currentValue,
          rank: totalWorkHoursCount.rank,
        },
      ]);
      promises.push([{ totalSeconds: totalWorkHoursCount.previousValue }]);
    }

    if (!infractionCount) {
      const infraction_count_query = ` SELECT
        count(*) as count,
        inf.user_id
        FROM infractions inf
        INNER JOIN users u ON inf.user_id=u.id
        WHERE
        u.role_id = :roleId AND inf.infraction_time>=:start AND inf.infraction_time<=:end AND
        (inf.show_after is null OR inf.show_after<=:showAfter)
        GROUP BY inf.user_id`;

      const infraction_rank = `
        SELECT 
          result.count,
          FIND_IN_SET( result.count, (
            SELECT GROUP_CONCAT( result.count
            ORDER BY result.count) 
            FROM (${infraction_count_query}) as result )
          ) AS rank
        FROM (${infraction_count_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(infraction_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
            showAfter: moment().format(),
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(infraction_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
            showAfter: moment().format(),
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      infractionCount = JSON.parse(infractionCount);
      promises.push([
        {
          count: infractionCount.currentValue,
          rank: infractionCount.rank,
        },
      ]);
      promises.push([{ count: infractionCount.previousValue }]);
    }

    if (!involRepossessionsCount) {
      const total_invol_repossessed_count_query = ` SELECT
          count(*) as count,
          u.id as user_id
          FROM cases c
          INNER JOIN users u ON c.repo_agent_rdn_id=u.rdn_id
          WHERE
          u.role_id = :roleId AND rdn_repo_date>=:start AND rdn_repo_date<=:end AND c.status in (:status) AND c.order_type =:orderType
          GROUP BY u.id`;

      const total_invol_repossessed_count_rank = `
        SELECT 
          result.count,
          FIND_IN_SET( result.count, (
            SELECT GROUP_CONCAT( result.count
            ORDER BY result.count DESC ) 
            FROM (${total_invol_repossessed_count_query}) as result )
          ) AS rank
        FROM (${total_invol_repossessed_count_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(total_invol_repossessed_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: moment(userDetailsFilterOptions.dateStart)
              .startOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            end: moment(userDetailsFilterOptions.dateEnd)
              .endOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            status: [CASE_STATUSES.repossessed],
            orderType: CASE_ORDER_TYPES.involuntary,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(total_invol_repossessed_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: moment(userDetailsFilterOptions.previousStartDate)
              .startOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            end: moment(userDetailsFilterOptions.previousEndDate)
              .endOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            status: [CASE_STATUSES.repossessed],
            orderType: CASE_ORDER_TYPES.involuntary,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      involRepossessionsCount = JSON.parse(involRepossessionsCount);
      promises.push([
        {
          count: involRepossessionsCount.currentValue,
          rank: involRepossessionsCount.rank,
        },
      ]);
      promises.push([{ count: involRepossessionsCount.previousValue }]);
    }

    if (!volRepossessedCount) {
      const total_vol_repossessed_count_query = ` SELECT
          count(*) as count,
          u.id as user_id
          FROM cases c
          INNER JOIN users u ON c.repo_agent_rdn_id=u.rdn_id
          WHERE
          u.role_id = :roleId AND rdn_repo_date>=:start AND rdn_repo_date<=:end AND c.status in (:status) AND c.order_type in (:orderTypes)
          GROUP BY u.id`;

      const total_vol_repossessed_count_rank = `
        SELECT 
          result.count,
          FIND_IN_SET( result.count, (
            SELECT GROUP_CONCAT( result.count
            ORDER BY result.count DESC ) 
            FROM (${total_vol_repossessed_count_query}) as result )
          ) AS rank
        FROM (${total_vol_repossessed_count_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(total_vol_repossessed_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: moment(userDetailsFilterOptions.dateStart)
              .startOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            end: moment(userDetailsFilterOptions.dateEnd)
              .endOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            status: [CASE_STATUSES.repossessed],
            orderTypes: VOLUNTARY_ORDER_TYPES,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(total_vol_repossessed_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: moment(userDetailsFilterOptions.previousStartDate)
              .startOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            end: moment(userDetailsFilterOptions.previousEndDate)
              .endOf('day')
              .add(-RDN_SERVER_TIME_ZONE_OFFSET, 'hours')
              .format(),
            status: [CASE_STATUSES.repossessed],
            orderTypes: VOLUNTARY_ORDER_TYPES,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      volRepossessedCount = JSON.parse(volRepossessedCount);
      promises.push([
        {
          count: volRepossessedCount.currentValue,
          rank: volRepossessedCount.rank,
        },
      ]);
      promises.push([{ count: volRepossessedCount.previousValue }]);
    }

    if (!spottedVehicleCount) {
      const spotted_vehicles_count_query = ` SELECT
        count(*) as count,
        u.id as user_id
        FROM cases c
        INNER JOIN users u ON c.spotter_id=u.id
        WHERE
        u.role_id = :roleId AND spotted_date>=:start AND spotted_date<=:end
        GROUP BY u.id`;

      const spotted_vehicles_count_rank = `
        SELECT 
          result.count,
          FIND_IN_SET( result.count, (
            SELECT GROUP_CONCAT( result.count
            ORDER BY result.count DESC ) 
            FROM (${spotted_vehicles_count_query}) as result )
          ) AS rank
        FROM (${spotted_vehicles_count_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(spotted_vehicles_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(spotted_vehicles_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      spottedVehicleCount = JSON.parse(spottedVehicleCount);
      promises.push([
        {
          count: spottedVehicleCount.currentValue,
          rank: spottedVehicleCount.rank,
        },
      ]);
      promises.push([{ count: spottedVehicleCount.previousValue }]);
    }

    if (!commissionCount) {
      const total_commission_count_query = ` SELECT
        sum(amount) as amount,
        u.id as user_id
        FROM user_commissions uc
        INNER JOIN users u ON uc.user_id=u.id
        WHERE
        u.role_id = :roleId AND uc.created_at>=:start AND uc.created_at<=:end
        GROUP BY u.id`;

      const total_commission_count_rank = `
        SELECT 
          result.amount,
          FIND_IN_SET( result.amount, (
            SELECT GROUP_CONCAT( result.amount
            ORDER BY result.amount DESC ) 
            FROM (${total_commission_count_query}) as result )
          ) AS rank
        FROM (${total_commission_count_query}) as result
        WHERE
          result.user_id=:userId
          ORDER BY rank`;

      promises.push(
        db[`${company.dbName}_sequelize`].query(total_commission_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: dateStart,
            end: dateEnd,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
      promises.push(
        db[`${company.dbName}_sequelize`].query(total_commission_count_rank, {
          replacements: {
            userId: userDetailsFilterOptions.userId,
            roleId: user.roleId,
            start: previousStartDate,
            end: previousEndDate,
          },
          type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
        }),
      );
    } else {
      commissionCount = JSON.parse(commissionCount);
      promises.push([
        {
          amount: commissionCount.currentValue,
          rank: commissionCount.rank,
        },
      ]);
      promises.push([{ amount: commissionCount.previousValue }]);
    }

    const [
      totalUsersByRoleCount,
      currentUserRankList,
      currentDateDriveTimeHoursCount,
      previousDateDriveTimeHoursCount,
      currentDateStartOnTimePercentage,
      previousDateStartOnTimePercentage,
      currentDateEndBeforeTimePercentage,
      previousDateEndBeforeTimePercentage,
      currentDateAvgWorkHoursCount,
      previousDateAvgWorkHoursCount,
      currentDateTotalWorkHoursCount,
      previousDateTotalWorkHoursCount,
      currentDateInfractionCount,
      previousDateInfractionCount,
      currentDateInvolRepossessionsCount,
      previousDateInvolRepossessionsCount,
      currentDateVolRepossessionsCount,
      previousDateVolRepossessionsCount,
      currentDateSpottedVehicleCount,
      previousDateSpottedVehicleCount,
      currentDateCommissionCount,
      previousDateCommissionCount,
    ] = await Promise.all(promises);

    totalUsersByRole = totalUsersByRoleCount;

    currentUserRank = findIndex(
      currentUserRankList,
      (userRank) => userRank.user_id === +userDetailsFilterOptions.userId,
    );

    driveTimeHoursCount = {
      previousValue: get(previousDateDriveTimeHoursCount, '[0].total_time_diff', 0) || 0,
      currentValue: get(currentDateDriveTimeHoursCount, '[0].total_time_diff', 0) || 0,
      rank: get(currentDateDriveTimeHoursCount, '[0].rank', 0),
    };

    startOnTimePercentage = {
      previousValue: get(previousDateStartOnTimePercentage, '[0].percentage', 0) || 0,
      currentValue: get(currentDateStartOnTimePercentage, '[0].percentage', 0) || 0,
      rank: get(currentDateStartOnTimePercentage, '[0].rank', 0),
    };

    endBeforeTimePercentage = {
      previousValue: get(previousDateEndBeforeTimePercentage, '[0].percentage', 0) || 0,
      currentValue: get(currentDateEndBeforeTimePercentage, '[0].percentage', 0) || 0,
      rank: get(currentDateEndBeforeTimePercentage, '[0].rank', 0),
    };

    avgWorkHoursCount = {
      previousValue: get(previousDateAvgWorkHoursCount, '[0].avgWorkSeconds', 0) || 0,
      currentValue: get(currentDateAvgWorkHoursCount, '[0].avgWorkSeconds', 0) || 0,
      rank: get(currentDateAvgWorkHoursCount, '[0].rank', 0),
    };

    totalWorkHoursCount = {
      previousValue: get(previousDateTotalWorkHoursCount, '[0].totalSeconds', 0) || 0,
      currentValue: get(currentDateTotalWorkHoursCount, '[0].totalSeconds', 0) || 0,
      rank: get(currentDateTotalWorkHoursCount, '[0].rank', 0),
    };

    infractionCount = {
      previousValue: get(previousDateInfractionCount, '[0].count', 0) || 0,
      currentValue: get(currentDateInfractionCount, '[0].count', 0) || 0,
      rank: get(currentDateInfractionCount, '[0].rank', 0),
    };

    involRepossessionsCount = {
      previousValue: get(previousDateInvolRepossessionsCount, '[0].count', 0) || 0,
      currentValue: get(currentDateInvolRepossessionsCount, '[0].count', 0) || 0,
      rank: get(currentDateInvolRepossessionsCount, '[0].rank', 0),
    };

    volRepossessedCount = {
      previousValue: get(previousDateVolRepossessionsCount, '[0].count', 0) || 0,
      currentValue: get(currentDateVolRepossessionsCount, '[0].count', 0) || 0,
      rank: get(currentDateVolRepossessionsCount, '[0].rank', 0),
    };

    spottedVehicleCount = {
      previousValue: get(previousDateSpottedVehicleCount, '[0].count', 0) || 0,
      currentValue: get(currentDateSpottedVehicleCount, '[0].count', 0) || 0,
      rank: get(currentDateSpottedVehicleCount, '[0].rank', 0),
    };

    commissionCount = {
      previousValue: get(previousDateCommissionCount, '[0].amount', 0) || 0,
      currentValue: get(currentDateCommissionCount, '[0].amount', 0) || 0,
      rank: get(currentDateCommissionCount, '[0].rank', 0),
    };

    return {
      total: totalUsersByRole[0].count,
      rank: currentUserRank < 0 ? 0 : currentUserRank + 1,
      drive_time_hours: {
        ...driveTimeHoursCount,
        total: totalUsersByRole[0].count,
      },
      start_on_time: {
        ...startOnTimePercentage,
        total: totalUsersByRole[0].count,
      },
      end_before_time: {
        ...endBeforeTimePercentage,
        total: totalUsersByRole[0].count,
      },
      average_hours_worked: {
        ...avgWorkHoursCount,
        total: totalUsersByRole[0].count,
      },
      total_hours_worked: {
        ...totalWorkHoursCount,
        total: totalUsersByRole[0].count,
      },
      infractions: {
        ...infractionCount,
        total: totalUsersByRole[0].count,
      },
      invol_repossessed_count: {
        ...involRepossessionsCount,
        total: totalUsersByRole[0].count,
      },
      vol_repossessed_count: {
        ...volRepossessedCount,
        total: totalUsersByRole[0].count,
      },
      spotted_vehicles: {
        ...spottedVehicleCount,
        total: totalUsersByRole[0].count,
      },
      commision_count: {
        ...commissionCount,
        total: totalUsersByRole[0].count,
      },
    };
  };

  const uploadUserImage = async (userUploadParams, bucketName) => {
    const fileName = `${userUploadParams.userId}/${Utils.makeID(10)}`;
    return await Utils.base64FileUpload(userUploadParams.base64Url, fileName, bucketName);
  };

  const validateDuplicatedUser = async (userId, reqData, company) => {
    if (reqData.email) {
      const duplicationCheckForEmail = {
        email: reqData.email,
        status: USER_STATUS.active,
      };
      let duplicatedEmail;
      if (!userId) {
        duplicatedEmail = await PlatformUser.findOne({
          where: {
            ...duplicationCheckForEmail,
            companyId: {
              [Sequelize.Op.not]: company.id,
            },
          },
        });
      }
      if (!duplicatedEmail) {
        const { User } = await companyService().getCompanyDatabase(company.dbName);
        duplicatedEmail = await User.findOne({
          where: {
            ...(userId && {
              id: {
                [Sequelize.Op.not]: userId,
              },
            }),
            ...duplicationCheckForEmail,
          },
        });
      }
      if (duplicatedEmail) {
        return {
          duplicated: true,
          message: messageConstants.EMAIL_ALREADY_EXIST,
        };
      }
    }

    if (reqData.rdnId) {
      let duplicatedRdnID = await PlatformUser.findOne({
        where: {
          companyId: {
            [Sequelize.Op.not]: company.id,
          },
          rdnId: reqData.rdnId,
        },
      });
      if (!duplicatedRdnID) {
        const { User } = await companyService().getCompanyDatabase(company.dbName);
        duplicatedRdnID = await User.findOne({
          where: {
            ...(userId && {
              id: {
                [Sequelize.Op.not]: userId,
              },
            }),
            rdnId: reqData.rdnId,
          },
        });
      }
      if (duplicatedRdnID) {
        return {
          duplicated: true,
          message: messageConstants.RDN_ID_ALREADY_EXIST,
        };
      }
    }

    if (reqData.drnId) {
      let duplicatedDrnID = await PlatformUser.findOne({
        where: {
          companyId: {
            [Sequelize.Op.not]: company.id,
          },
          drnId: reqData.drnId,
        },
      });
      if (!duplicatedDrnID) {
        const { User } = await companyService().getCompanyDatabase(company.dbName);
        duplicatedDrnID = await User.findOne({
          where: {
            id: {
              [Sequelize.Op.not]: userId,
            },
            drnId: reqData.drnId,
          },
        });
      }
      if (duplicatedDrnID) {
        return {
          duplicated: true,
          message: messageConstants.DRN_ID_ALREADY_EXIST,
        };
      }
    }

    return { duplicated: false };
  };

  const createUser = async (company, reqData, avatar = null) => {
    const { Role, User } = await companyService().getCompanyDatabase(company.dbName);

    const duplicatedUser = await validateDuplicatedUser(null, reqData, company);
    serverLogger.log({
      operationName: 'createUser',
      message: `Email: ${reqData.email} duplicatedUser=> ${duplicatedUser}`,
      level: 'info',
    });
    if (duplicatedUser && duplicatedUser.duplicated) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: duplicatedUser.message,
      };
      return err;
    }
    serverLogger.log({
      operationName: 'createUser',
      message: `Email: ${reqData.email} no duplicatedUser`,
      level: 'info',
    });

    if (reqData.status === 'false') {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.USER_STATUS_DISABLED,
      };
      return err;
    }

    let user = await User.create({
      ...reqData,
      password: bcryptService().password(reqData.password),
      status: USER_STATUS.active,
      isPasswordChangeRequired: true,
    });
    serverLogger.log({
      operationName: 'createUser',
      message: `Email: ${reqData.email} user created in DB`,
      level: 'info',
    });

    if (avatar) {
      const userUploadParams = {
        userId: user.id,
        base64Url: avatar,
      };
      user.avatarUrl = await uploadUserImage(userUploadParams, company.awsProfilePicsBucketName);
      await user.save();
      serverLogger.log({
        operationName: 'createUser',
        message: `Email: ${reqData.email} user image uploaded and saved in DB`,
        level: 'info',
      });
    }

    await PlatformUser.create({
      rdnId: user.rdnId,
      drnId: user.drnId,
      email: user.email,
      status: user.status,
      password: user.password,
      companyId: company.id,
    });

    serverLogger.log({
      operationName: 'createUser',
      message: `Email: ${reqData.email} user saved in platform user table`,
      level: 'info',
    });

    user = await User.findOne({
      where: {
        email: reqData.email,
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'type', 'role'],
        },
      ],
    });

    serverLogger.log({
      operationName: 'createUser',
      message: `Email: ${reqData.email} user record fetched`,
      level: 'info',
    });

    const invitationTokenResponse = await storeInvitationToken(reqData.password, user, company.dbName);
    serverLogger.log({
      operationName: 'createUser',
      message: `Email: ${reqData.email} invitation token created`,
      level: 'info',
    });
    if (!invitationTokenResponse.success) {
      return invitationTokenResponse.error;
    }

    return user;
  };

  const getCompanyDetails = async (dbName) => {
    const platformCompany = await PlatformCompany.findOne({
      where: {
        dbName,
      },
    });
    return platformCompany;
  };

  const getPlatformUserDetails = async (reqData) => {
    const platformUser = await PlatformUser.findOne({
      where: {
        ...reqData,
      },
    });
    return platformUser;
  };

  const storePasswordResetToken = async (user, dbName) => {
    if (user && dbName) {
      const token = tokenService().issueJWT({ id: user.id, dbName: dbName });

      const { PasswordResetToken } = await companyService().getCompanyDatabase(dbName);

      const platformCompany = await PlatformCompany.findOne({
        where: {
          dbName,
        },
        raw: true,
      });

      if (!platformCompany) {
        const error = {
          status: httpStatus.UNAUTHORIZED,
          message: messageConstants.COMPANY_DOES_NOT_EXIST,
        };
        return {
          success: false,
          error,
        };
      }

      await PasswordResetToken.create({
        userId: user.id,
        token,
      });

      const config = {
        to: user.email,
        subject: 'Reset password for your Insightt account',
        template: 'reactivate-user',
        templateOptions: {
          firstName: user.firstName,
          resetPasswordLink: `${emailDomain}/user/reset-password/${token}/`,
        },
        emailReplyAddress: emailReplyAddress || platformCompany.emailReplyAddress,
      };

      await reSendMailToUserService(config);

      return { success: true };
    }
  };

  const storeInvitationToken = async (defaultPassword, user, dbName) => {
    if (defaultPassword && user && dbName) {
      const { InvitationToken, Role } = await companyService().getCompanyDatabase(dbName);

      const platformCompany = await PlatformCompany.findOne({
        where: {
          dbName,
        },
        raw: true,
      });

      if (!platformCompany) {
        const error = {
          status: httpStatus.UNAUTHORIZED,
          message: messageConstants.COMPANY_DOES_NOT_EXIST,
        };
        return {
          success: false,
          error,
        };
      }
      const payload = { id: user.id, dbName };
      const token = tokenService().issueJWT(payload);
      await InvitationToken.create({
        userId: user.id,
        token,
      });

      const userRole = await Role.findOne({
        where: {
          id: user.roleId,
        },
        raw: true,
      });

      const video = INTRO_VIDEOS[userRole.type];
      try {
        const mailConfig = await mailService().config({
          to: user.email,
          subject: 'Welcome to Insightt Portal!',
          template: 'invite-user',
          templateOptions: {
            firstName: user.firstName,
            inviteLink: `${emailDomain}/user/invitation/${token}/`,
            companyLink: emailDomain,
            password: defaultPassword,
            video,
          },
          emailReplyAddress: emailReplyAddress || platformCompany.emailReplyAddress,
        });
        await mailService().send(mailConfig);
      } catch (e) {
        serverLogger.log({
          operationName: 'sendMailError',
          message: `===> Error on user ${user.email} Welcome to Insightt Portal!: ${e}`,
          error: e,
          level: 'error',
        });
      }

      return { success: true };
    }
  };

  const updateUser = async (reqData, userOptions, company) => {
    const { Role, User, Branch, UserActivity } = await companyService().getCompanyDatabase(company.dbName);
    const avatar = userOptions.avatar;

    const user = await User.findOne({
      where: {
        id: userOptions.userId,
      },
    });
    const userEmail = user.email;

    if (!user) {
      const error = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.USER_DOES_NOT_EXIST,
      };
      return { success: false, error };
    }

    let userActivityNote = '';
    if (!isUndefined(reqData.firstName)) {
      if (reqData.firstName != user.firstName) {
        if (reqData.firstName && user.firstName) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} first name from ${user.firstName} to ${
            reqData.firstName
          }`;
        }
        if (reqData.firstName && !user.firstName) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set first name ${reqData.firstName}`;
        }
        if (!reqData.firstName && user.firstName) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset first name`;
        }
      }
    }

    if (!isUndefined(reqData.lastName)) {
      if (reqData.lastName != user.lastName) {
        if (reqData.lastName && user.lastName) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} last name from ${user.lastName} to ${
            reqData.lastName
          }`;
        }
        if (reqData.lastName && !user.lastName) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set last name ${reqData.lastName}`;
        }
        if (!reqData.lastName && user.lastName) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset last name`;
        }
      }
    }

    if (!isUndefined(reqData.email)) {
      if (reqData.email != user.email) {
        if (reqData.email && user.email) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} email from ${user.email} to ${
            reqData.email
          }`;
        }
        if (reqData.email && !user.email) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set email ${reqData.email}`;
        }
        if (!reqData.email && user.email) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset email`;
        }
      }
    }

    if (!isUndefined(reqData.phoneNumber)) {
      if (reqData.phoneNumber != user.phoneNumber) {
        if (reqData.phoneNumber && user.phoneNumber) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} phone number from ${
            user.phoneNumber
          } to ${reqData.phoneNumber}`;
        }
        if (reqData.phoneNumber && !user.phoneNumber) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set phone number ${reqData.phoneNumber}`;
        }
        if (!reqData.phoneNumber && user.phoneNumber) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset phone number`;
        }
      }
    }

    if (!isUndefined(reqData.rdnId)) {
      if (reqData.rdnId != user.rdnId) {
        if (reqData.rdnId && user.rdnId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} RDN ID from ${user.rdnId} to ${
            reqData.rdnId
          }`;
        }
        if (reqData.rdnId && !user.rdnId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set RDN ID ${reqData.rdnId}`;
        }
        if (!reqData.rdnId && user.rdnId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset RDN ID`;
        }
      }
    }

    if (!isUndefined(reqData.drnId)) {
      if (reqData.drnId != user.drnId) {
        if (reqData.drnId && user.drnId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} DRN ID from ${user.drnId} to ${
            reqData.drnId
          }`;
        }
        if (reqData.drnId && !user.drnId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set DRN ID ${reqData.drnId}`;
        }
        if (!reqData.drnId && user.drnId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset DRN ID`;
        }
      }
    }

    if (!isUndefined(reqData.branchId)) {
      if (reqData.branchId != user.branchId) {
        const [previousBranch, requestedBranch] = await Promise.all([
          Branch.findOne({
            where: {
              id: user.branchId,
            },
          }),
          Branch.findOne({
            where: {
              id: reqData.branchId,
            },
          }),
        ]);

        if (reqData.branchId && user.branchId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} branch from ${previousBranch.name} to ${
            requestedBranch.name
          }`;
        }
        if (reqData.branchId && !user.branchId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set branch name ${requestedBranch.name}`;
        }
        if (!reqData.branchId && user.branchId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset branch name`;
        }
      }
    }

    if (!isUndefined(reqData.roleId)) {
      if (reqData.roleId != user.roleId) {
        const [previousRole, requestedRole] = await Promise.all([
          Role.findOne({
            where: {
              id: user.roleId,
            },
          }),
          Role.findOne({
            where: {
              id: reqData.roleId,
            },
          }),
        ]);

        if (reqData.roleId && user.roleId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} role from ${previousRole.name} to ${
            requestedRole.name
          }`;
        }
        if (reqData.roleId && !user.roleId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set role name ${requestedRole.name}`;
        }
        if (!reqData.roleId && user.roleId) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset role name`;
        }
      }
    }

    if (!isUndefined(reqData.hourlyRate)) {
      if (reqData.hourlyRate != user.hourlyRate) {
        if (reqData.hourlyRate && user.hourlyRate) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} hourly rate from ${user.hourlyRate} to ${
            reqData.hourlyRate
          }`;
        }
        if (reqData.hourlyRate && !user.hourlyRate) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} set hourly rate ${reqData.hourlyRate}`;
        }
        if (!reqData.hourlyRate && user.hourlyRate) {
          userActivityNote += `${userActivityNote ? ', ' : 'has'} unset hourly rate`;
        }
      }
    }

    if (!isUndefined(reqData.hireDate)) {
      if (reqData.hireDate && user.hireDate) {
        if (moment(reqData.hireDate).toISOString() != user.hireDate.toISOString()) {
          userActivityNote += `${userActivityNote ? ', ' : 'has changed'} hire date from ${user.hireDate} to ${
            reqData.hireDate
          }`;
        }
      }
      if (reqData.hireDate && !user.hireDate) {
        userActivityNote += `${userActivityNote ? ', ' : 'has'} set hire date ${reqData.hireDate}`;
      }
      if (!reqData.hireDate && user.hireDate) {
        userActivityNote += `${userActivityNote ? ', ' : 'has'} unset hire date`;
      }
    }

    if (userActivityNote) {
      await UserActivity.create({
        userId: userOptions.currentUserId,
        updateNote: `${userActivityNote} of`,
        type: USER_ACTIVITIES.profile,
        targetUserId: user.id,
        updateTime: moment().format(),
      });
    }

    const duplicatedUser = await validateDuplicatedUser(userOptions.userId, reqData, company);
    if (duplicatedUser && duplicatedUser.duplicated) {
      const error = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: duplicatedUser.message,
      };
      return { success: false, error };
    }

    if (avatar) {
      if (user.avatarUrl) {
        await Utils.deleteImageFromAwsBucket(user.avatarUrl, company.awsProfilePicsBucketName);
      }
      const userUploadParams = {
        userId: user.id,
        base64Url: avatar,
      };
      user.avatarUrl = await uploadUserImage(userUploadParams, company.awsProfilePicsBucketName);
    }
    forEach(reqData, (value, key) => {
      user[key] = value;
    });
    await user.save();

    // If this update is a case of reactivating disabled user
    // We will need to send reactivation link to user
    const isReactivatedUser = user.status === USER_STATUS.disabled && reqData.status == USER_STATUS.active;
    if (isReactivatedUser) {
      const passwordResetTokenResponse = await storePasswordResetToken(user, company.dbName);
      if (!passwordResetTokenResponse.success) {
        return { success: false, error: passwordResetTokenResponse.error };
      }
    }

    const updatedUser = await User.findOne({
      where: {
        id: userOptions.userId,
      },
      attributes: {
        exclude: ['password'],
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'type', 'role'],
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
    });

    const platformUser = await getPlatformUserDetails({
      email: userEmail,
      companyId: company.id,
    });

    if (platformUser) {
      await PlatformUser.update(
        {
          rdnId: user.rdnId,
          drnId: user.drnId,
          password: user.password,
          email: updatedUser.email,
          status: user.status,
        },
        {
          where: {
            id: platformUser.id,
          },
        },
      );
    } else {
      await PlatformUser.create({
        dnId: user.rdnId,
        drnId: user.drnId,
        password: user.password,
        status: user.status,
        companyId: company.id,
      });
    }

    return { success: true, user: updatedUser };
  };

  const getUserById = async (dbName, id) => {
    const { User, Role, Branch } = await companyService().getCompanyDatabase(dbName);
    const user = await User.findOne({
      where: {
        id,
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'type', 'role'],
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
      raw: true,
      nest: true,
    });
    return user;
  };
  const getUsersByBranchId = async (dbName, branchId) => {
    const { User } = await companyService().getCompanyDatabase(dbName);
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      where: {
        branchId,
      },
    });
    return users;
  };

  const getAdminsOrBranchManager = async (dbName, spottedMainBranchId) => {
    const adminsAndBranchManagersSql = `
      Select 
        *
      From
        users u
      INNER JOIN
        roles r
      ON
        u.role_id=r.id AND 
        (
          r.role in (:admins)
          OR
          r.type='${BRANCH_MANAGER}' AND
          u.branch_id=:branchId
        )
      where
        status='${USER_STATUS.active}'
    `;

    const adminsAndBranchManagers = await db[`${dbName}_sequelize`].query(adminsAndBranchManagersSql, {
      replacements: {
        admins: ADMIN_ROLES,
        branchId: +spottedMainBranchId,
      },
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    return adminsAndBranchManagers;
  };

  const reSendMailToUserService = async (config) => {
    try {
      const mailConfig = mailService().config(config);
      await mailService().send(mailConfig);
    } catch (e) {
      serverLogger.log({
        operationName: 'sendMailError',
        message: `===> Error on user ${config.to} ${config.subject}: ${e}`,
        error: e,
        level: 'error',
      });
    }
  };

  return {
    getUserDetails,
    uploadUserImage,
    validateDuplicatedUser,
    createUser,
    getCompanyDetails,
    getPlatformUserDetails,
    storePasswordResetToken,
    updateUser,
    getUserById,
    getAdminsOrBranchManager,
    getUsersByBranchId,
    reSendMailToUserService,
  };
};

module.exports = userService;
