const httpStatus = require('http-status');
const moment = require('moment-timezone');
const Sequelize = require('sequelize');
const { map, filter, includes, sumBy } = require('lodash');
const db = require('../database/models');
const Utils = require('../utils/util');
const APIError = require('../utils/APIError');
const {
  MANAGER_ROLES,
  BREAK_TIME_TYPES,
  END_SHIFT_TYPES,
  USER_ACTIVITIES,
  WEEKLY_HOUR_LIMIT_IN_SECONDS,
} = require('../constants/app.constants');
const messageConstants = require('../constants/message.constants');
const { CASE_STATUSES } = require('../rdn/constants');

const statsService = () => {
  const companyService = require('./company.service');
  const getShiftsReports = async (dateRange, user, userId, shiftType, company) => {
    const { TimeClock, ShiftTime, Shift, Session } = await companyService().getCompanyDatabase(company.dbName);
    if (!includes(MANAGER_ROLES, user.role.role) && Number(userId) !== user.id) {
      const err = {
        status: httpStatus.FORBIDDEN,
        message: messageConstants.PERMISSION_ERROR,
      };
      throw new APIError(err);
    }

    const sql_shift_times = `
      SELECT
        st.id as shift_time_id,
        st.shift_id as shift_id,
        st.user_device_type as device_type,
        concat(u.first_name, ' ', u.last_name) as employee,
        u.id as employee_id,
        st.start_time as start_shift,
        st.user_device_token as device_token,
        st.end_time as end_shift,
        st.manual_count,
        st.is_start_time_change,
        st.is_end_time_change,
        st.end_shift_type,
        TIMESTAMPDIFF(SECOND, st.start_time,
          IF
          (
            st.end_time is null,
            last_geoLocations_record.end_track_time,
            st.end_time
          )
        ) as time
      FROM shift_times st
      INNER JOIN users u ON st.user_id=u.id
      LEFT JOIN (
        SELECT *
          FROM geo_locations
          WHERE id IN (
              SELECT MAX(id)
              FROM geo_locations
              GROUP BY shift_time_id
          )
      ) as last_geoLocations_record
      ON st.id = last_geoLocations_record.shift_time_id
      WHERE
        start_time>=:start AND start_time<=:end AND shift_type=:shift_type AND st.user_id=:userId
      ORDER BY shift_time_id ASC;
    `;

    const stats_result = await db[`${company.dbName}_sequelize`].query(sql_shift_times, {
      replacements: {
        userId,
        start: dateRange.start,
        end: dateRange.end,
        shift_type: shiftType,
      },
      type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
    });

    const shift_time_ids = map(stats_result, 'shift_time_id');

    if (shift_time_ids.length) {
      const sql_break_times = `
        SELECT bt.id, bt.shift_time_id, bt.type, bt.start_time, bt.end_time, bt.time_clock_id,
          TIMESTAMPDIFF(SECOND, bt.start_time, bt.end_time) AS timediff
        FROM break_times bt
        WHERE bt.shift_time_id IN (:shift_time_ids) AND bt.end_time is not NULL
        ORDER BY bt.created_at ASC
      `;

      const break_times = await db[`${company.dbName}_sequelize`].query(sql_break_times, {
        replacements: {
          shift_time_ids: shift_time_ids.length ? shift_time_ids : [''],
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      });

      const shiftTimeHistories = await getShiftTimeHistory(shift_time_ids, userId, company.dbName);
      if (stats_result.length) {
        let i = 0;
        for (let item of stats_result) {
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
          let history = [];
          if (shiftTimeHistories) {
            history = filter(shiftTimeHistories, (history) => item.shift_time_id === history.shiftTimeId);
          }

          item['break_overtime'] = null;

          if (_breaks.length) {
            for (let b of _breaks) {
              const tc = await TimeClock.findOne({
                where: { id: b.time_clock_id },
                raw: true,
              });

              const allowed = tc.allowedTime * 60;

              const startTime = moment(b.start_time).format();
              const endTime = moment(b.end_time).format();

              const diff = moment(endTime).diff(startTime, 'seconds');

              if (diff > allowed) {
                b.overtime = Utils.nonZeroSec2time(diff - allowed);
              }
            }
          }

          if (i === stats_result.length - 1) {
            const startOfWeek = moment(item.start_shift).startOf('week').format();
            const currentDate = moment(item.end_shift).format();

            const allWeekShifts = await ShiftTime.findAll({
              where: {
                userId,
                startTime: {
                  [Sequelize.Op.gte]: startOfWeek,
                },
                endTime: {
                  [Sequelize.Op.lte]: currentDate,
                },
              },
              raw: true,
            });

            const totalWorkingSeconds = allWeekShifts.reduce((acc, curr) => {
              const startTime = moment(curr.startTime);
              const endTime = moment(curr.endTime);

              const seconds = endTime.diff(startTime, 'seconds');

              return acc + seconds;
            }, 0);

            console.log(Utils.nonZeroSec2time(totalWorkingSeconds));

            if (totalWorkingSeconds > WEEKLY_HOUR_LIMIT_IN_SECONDS) {
              item['weekly_overtime'] = Utils.nonZeroSec2time(totalWorkingSeconds - WEEKLY_HOUR_LIMIT_IN_SECONDS);
            }
          }

          const shift = await Shift.findOne({
            where: {
              id: item.shift_id,
            },
            raw: true,
          });

          if (shift && i === stats_result.length - 1) {
            console.log(shift);
            const startTime = shift.startTime.split(':');
            const endTime = shift.endTime.split(':');

            const shiftDurationInSeconds = moment({
              h: endTime[0],
              m: endTime[1],
            }).diff(
              moment({
                h: startTime[0],
                m: startTime[1],
              }),
              'seconds',
            );

            const workedShiftSeconds = stats_result.reduce((acc, curr) => {
              return acc + curr.time;
            }, 0);

            if (workedShiftSeconds > shiftDurationInSeconds) {
              item['shift_overtime'] = Utils.nonZeroSec2time(workedShiftSeconds - shiftDurationInSeconds);
            }
          }

          const session = await Session.findOne({
            where: {
              deviceToken: item.device_token,
            },
            raw: true,
          });

          item['desktop_session'] = session?.device === 'web';

          item['history'] = history;
          item['breaks'] = _breaks;
          item['isStartTimeChange'] = item.is_start_time_change;
          item['isEndTimeChange'] = item.is_end_time_change;
          item['pauses'] = _pauses;
          item['idles'] = _idles;
          item['isManualEnd'] =
            !item.end_shift_type || item.end_shift_type === END_SHIFT_TYPES.manual ? true : false;
          item['break_total'] = sumBy(_breaks, (b) => b.timediff);
          item['pause_total'] = sumBy(_pauses, (b) => b.timediff);
          item['idle_total'] = sumBy(_idles, (b) => b.timediff);
          item['total_seconds'] = +item.time - +item.manual_count;
          item['driving_total'] =
            item.device_type === 'web'
              ? 0
              : +item.time - item['break_total'] - item['pause_total'] - item['idle_total'] - +item.manual_count;

          item['break_total'] = Utils.nonZeroSec2time(item['break_total']);
          item['pause_total'] = Utils.nonZeroSec2time(item['pause_total']);
          item['idle_total'] = Utils.nonZeroSec2time(item['idle_total']);
          item['driving_total'] = Utils.nonZeroSec2time(item['driving_total']);
          item['total'] = Utils.nonZeroSec2time(item['total_seconds']);
          i++;
        }
      }
    }
    return stats_result;
  };

  const getShiftTimeHistory = async (shiftTimeIds, userId, dbName) => {
    if (!dbName) return;
    const { UserActivity, User, Shift } = await companyService().getCompanyDatabase(dbName);
    return await UserActivity.findAll({
      where: {
        shiftTimeId: {
          [Sequelize.Op.in]: shiftTimeIds,
        },
        type: USER_ACTIVITIES.timesheet,
        targetUserId: userId,
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: User,
          as: 'targetUser',
          attributes: ['id', 'firstName', 'lastName'],
        },
        {
          model: Shift,
          as: 'shift',
        },
      ],
    });
  };

  const getMyMissedOpportunitiesService = async (startTime, endTime, userId, dbName) => {
    const sql = `
        SELECT
          c.case_id as caseId,
          c.status as status,
          c.order_type as orderType,
          c.vin as vin,
          c.year_make_model as yearMakeModel,
          c.vehicle_color as vehicleColor,
          c.lender_client_name as lenderClientName,
          c.spotted_date as spottedDate,
          c.spotted_note as spottedNote,
          c.spotted_address as spottedAddress
        FROM
          cases c
        INNER JOIN
          (
            SELECT
              sp.*,
              shift_times_result.start_time,
              shift_times_result.end_time
            FROM
              spot_notified_agents sp
            INNER JOIN
            (
              SELECT
                *
              FROM
                shift_times st
              WHERE
                st.start_time>=:start AND
                st.start_time<=:end AND
                st.end_time is not null
            ) as shift_times_result
            ON sp.user_id=shift_times_result.user_id AND
                sp.created_at >= shift_times_result.start_time AND
                sp.created_at <= shift_times_result.end_time
          ) as spot_notified_agent_result
          ON
            spot_notified_agent_result.case_id=c.case_id
          WHERE
            spot_notified_agent_result.user_id=:userId AND
            c.spotted_date is not null AND
            c.spotted_date >= spot_notified_agent_result.start_time AND
            c.spotted_date <= spot_notified_agent_result.end_time AND
            (
              (
                c.status != '${CASE_STATUSES.repossessed}'
              )
              OR
              (
                c.status='${CASE_STATUSES.repossessed}' AND
                rdn_repo_date>=DATE_ADD(spot_notified_agent_result.end_time, interval 7 hour)
              )
          )
      `;

    const missedOpportunities = await db[`${dbName}_sequelize`].query(sql, {
      replacements: {
        start: startTime,
        end: endTime,
        userId: userId,
      },
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    return missedOpportunities;
  };

  return {
    getShiftsReports,
    getMyMissedOpportunitiesService,
  };
};

module.exports = statsService;
