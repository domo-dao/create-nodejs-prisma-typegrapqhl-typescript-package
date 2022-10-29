const moment = require('moment');
const Sequelize = require('sequelize');
const httpStatus = require('http-status');
const {
  EXPIRY_TIME_ALERTS_FEED,
  SHIFT_FEED_CATEGORIES,
  INFRACTION_TYPES,
  AUTO_SAVE,
  ENABLED,
  UNKNOWN_BRANCH_ID,
  BREAK_TIME_TYPES,
  NOTIFICATION_COLOR,
  SHIFT_FEED_TYPES,
  COMMISSION_TYPES,
  COMMISSION_STATUSES,
  INFRACTION_STATUS,
} = require('../constants/app.constants');
const messageConstants = require('../constants/message.constants');
const { serverLogger } = require('../config/logger');
const APIError = require('../utils/APIError');
const saveAllInfractionJob = require('./queues/save-all-infractions.queue');
const { CASE_STATUSES, INVOLUNTARY_ORDER_TYPES } = require('../rdn/constants');
const Utils = require('../utils/util');
const { map, isEmpty } = require('lodash');

const shiftAdminService = () => {
  const companyService = require('./company.service');
  const saveAllUserInfractionAsRecord = async (branchIds, userId, company) => {
    const { ShiftFeed, User } = await companyService().getCompanyDatabase(company.dbName);
    const currentDateTime = new Date();
    currentDateTime.setHours(currentDateTime.getHours() + EXPIRY_TIME_ALERTS_FEED);

    const allInfractions = await ShiftFeed.findAll({
      where: {
        expiryDate: {
          [Sequelize.Op.eq]: null,
        },
        category: SHIFT_FEED_CATEGORIES.infraction,
        type: {
          [Sequelize.Op.not]: INFRACTION_TYPES.task_not_completed_in_time,
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          where: {
            branchId: {
              [Sequelize.Op.in]: branchIds,
            },
          },
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    allInfractions.map(async (infraction) => {
      try {
        if (!infraction) {
          const err = {
            status: httpStatus.UNPROCESSABLE_ENTITY,
            message: messageConstants.SHIFT_FEED_NOT_FOUND,
          };
          throw new APIError(err);
        }

        const infractionParams = {
          infraction,
          currentDateTime,
          company,
          userId,
        };
        saveAllInfractionJob.add(infractionParams);
      } catch (error) {
        serverLogger.log({
          operationName: 'saveAllUserInfractionAsRecord',
          message: error.message,
          error: error,
          level: 'error',
        });
      }
    });
  };

  const autoSaveInfraction = async (notifyFeed, company) => {
    const { ShiftFeed, User, Setting, Branch, Infraction } = await companyService().getCompanyDatabase(
      company.dbName,
    );
    const currentDateTime = new Date();
    currentDateTime.setHours(currentDateTime.getHours() + EXPIRY_TIME_ALERTS_FEED);

    const notifyFeedUserBranch = await User.findOne({
      where: {
        id: notifyFeed.userId,
      },
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
    });
    if (!notifyFeedUserBranch.branch) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.BRANCH_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }
    if (notifyFeedUserBranch && notifyFeedUserBranch.branch) {
      const autoSaveSetting = await Setting.findOne({
        where: {
          settingType: AUTO_SAVE,
          branchId: notifyFeedUserBranch && notifyFeedUserBranch.branch.id,
          value: ENABLED,
        },
      });
      // TODO: WE should always save the Infraction with a DRAFT status, and if the auto save setting is on, we should change the status to SAVED
      if (autoSaveSetting) {
        await Promise.all([
          Infraction.create({
            shiftFeedId: notifyFeed.id, // TODO: This has to be a Foreign Key
            showAfter: currentDateTime,
            userId: notifyFeed.userId, // TODO: This also has to be a Foreign Key
            adminId: autoSaveSetting.userId,
            objectId: notifyFeed.objectId,
            type: notifyFeed.type,
            reason: notifyFeed.reason,
            status: INFRACTION_STATUS.draft,
            infractionTime: notifyFeed.createdAt,
          }),
          // I not sure what this is doing
          ShiftFeed.update(
            {
              expiryDate: currentDateTime,
            },
            {
              where: {
                id: notifyFeed.id,
              },
            },
          ),
        ]);
      } else {
        serverLogger.log({
          operationName: 'autoSaveInfraction',
          message: 'Infraction record not auto save',
          notifyFeed,
          level: 'error',
        });
      }
    }
  };

  const getUnitsPendingRepossessions = async (shiftBranchId, dbName, shiftWorkHours) => {
    const { User, Case, Branch } = await companyService().getCompanyDatabase(dbName);
    const unitsPendingRepossessions = await Case.findAll({
      attributes: [
        'caseId',
        'vin',
        'orderType',
        'yearMakeModel',
        'vehicleColor',
        'lenderClientName',
        'spottedBranchId',
        'spotterId',
        'spottedDate',
        'spottedNote',
        'spottedAddress',
      ],
      where: {
        spottedBranchId: {
          [Sequelize.Op.in]: Utils.__BRANCH_IDS__[dbName][shiftBranchId],
        },
        status: {
          [Sequelize.Op.in]: [CASE_STATUSES.open, CASE_STATUSES.need_info],
        },
        spottedDate: {
          [Sequelize.Op.gte]: shiftWorkHours.startTime,
          [Sequelize.Op.lte]: shiftWorkHours.endTime,
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'avatarUrl'],
          include: [
            {
              model: Branch,
              as: 'branch',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
      order: [['spottedDate', 'DESC']],
      raw: true,
      nest: true,
    });
    return unitsPendingRepossessions;
  };

  const getActiveShiftsOverviewV2 = async (company) => {
    const now = moment().valueOf();

    const shiftService = require('./shift.service'); // This is to avoid cyclic dependency

    const { Case, Shift, ShiftTime, Branch, CameraHit, CameraScan, Role, BreakTime, User } =
      await companyService().getCompanyDatabase(company.dbName);

    const [shifts, branches, users] = await Promise.all([
      Shift.findAll({
        include: [{ model: Branch, as: 'branch' }],
      }),
      Branch.findAll({ raw: true }),
      User.findAll({
        include: [
          { model: Branch, as: 'branch' },
          { model: Role, as: 'role' },
        ],
        raw: true,
        nest: true,
      }),
    ]);

    users.forEach((user) => {
      user.branchName = user.branch.name;
    });

    let workingHoursStartTime = now;
    let workingHoursEndTime = now;

    const activeShifts = shifts.reduce((validShifts, currentShift) => {
      const workHours = shiftService().getShiftWorkHours(currentShift);

      const startTime = moment(workHours.startTime).valueOf();
      const endTime = moment(workHours.endTime).valueOf();

      if (now >= startTime && now <= endTime) {
        validShifts.push(currentShift);

        if (startTime < workingHoursStartTime) {
          workingHoursStartTime = startTime;
        }

        if (endTime > workingHoursEndTime) {
          workingHoursEndTime = endTime;
        }
      }

      return validShifts;
    }, []);

    let peopleInActiveShifts = await ShiftTime.findAll({
      where: {
        shiftId: {
          [Sequelize.Op.in]: activeShifts.map(({ id }) => id),
        },
        startTime: {
          [Sequelize.Op.gte]: moment(workingHoursStartTime).utc().format(),
        },
      },
      raw: true,
    });

    peopleInActiveShifts = peopleInActiveShifts.map((shiftTime) => ({
      ...shiftTime,
      user: users.find((user) => user.id === shiftTime.userId),
      shiftStatus: shiftTime,
      infractions: 0, // TODO: Find real values
      commissionCount: 0, // TODO: Find real values
      involuntaryRepossessionsCount: 0, // TODO: Find real values
      totalRepossessionsCount: 0, // TODO: Find real values
      totalVehiclesCount: 0, // TODO: Find real values
    }));

    const infractions = await BreakTime.findAll({
      where: {
        type: {
          [Sequelize.Op.in]: [BREAK_TIME_TYPES.idle, BREAK_TIME_TYPES.inactivity],
        },
        shiftTimeId: {
          [Sequelize.Op.in]: peopleInActiveShifts.map(({ id }) => id),
        },
      },
      raw: true,
    });

    const rdnBranches = Object.keys(Utils.__BRANCH_IDS__[company.dbName]).reduce((ids, branch) => {
      if (branch == UNKNOWN_BRANCH_ID) return ids;

      Utils.__BRANCH_IDS__[company.dbName][branch].forEach((branchId) => {
        ids.push(branchId);
      });

      return ids;
    }, []);
    const cases = await Case.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            spotterId: {
              [Sequelize.Op.in]: peopleInActiveShifts.map(({ userId }) => userId),
            },
            spottedDate: {
              [Sequelize.Op.gte]: moment(workingHoursStartTime).utc().format(),
              [Sequelize.Op.lte]: moment(workingHoursEndTime).utc().format(),
            },
            spottedBranchId: {
              [Sequelize.Op.in]: rdnBranches,
            },
          },
          {
            repoAgentRdnId: {
              [Sequelize.Op.in]: peopleInActiveShifts.map(({ user }) => user.rdnId),
            },
            repoDate: {
              [Sequelize.Op.gte]: moment(workingHoursStartTime).utc().format(),
              [Sequelize.Op.lte]: moment(workingHoursEndTime).utc().format(),
            },
          },
        ],
      },
      raw: true,
    });

    let totalSpottedVehicles = cases.filter((vehicle) => !!vehicle.spotterId);
    let totalRepossessions = cases.filter(
      (vehicle) => !!vehicle.repoAgentRdnId && [CASE_STATUSES.repossessed].includes(vehicle.status),
    );
    let totalUnitsPendingRepossessions = cases.filter(
      (vehicle) => !!vehicle.spotterId && [CASE_STATUSES.open, CASE_STATUSES.need_info].includes(vehicle.status),
    );

    totalSpottedVehicles = totalSpottedVehicles.map((vehicle) => ({
      ...vehicle,
      shiftId: peopleInActiveShifts.find((shiftTime) => shiftTime.userId === vehicle.spotterId)?.shiftId,
      user: users.find((user) => user.id === vehicle.spotterId),
      spottedGeoLocation: {
        lat: vehicle.spottedLat,
        lng: vehicle.spottedLng,
      },
    }));
    totalRepossessions = totalRepossessions.map((vehicle) => ({
      ...vehicle,
      isSecured: !!vehicle.spottedDate,
      shiftId: peopleInActiveShifts.find((shiftTime) => shiftTime.userId === vehicle.spotterId)?.shiftId,
      user: users.find((user) => user.rdnId === vehicle.repoAgentRdnId),
      repoGeoLocation: {
        lat: vehicle.spottedLat,
        lng: vehicle.spottedLng,
      },
    }));
    totalUnitsPendingRepossessions = totalUnitsPendingRepossessions.map((vehicle) => ({
      ...vehicle,
      shiftId: peopleInActiveShifts.find((shiftTime) => shiftTime.userId === vehicle.spotterId)?.shiftId,
      user: users.find((user) => user.id === vehicle.spotterId),
      spottedGeoLocation: {
        lat: vehicle.spottedLat,
        lng: vehicle.spottedLng,
      },
    }));

    let vehiclesInRepossessionHitList = await Case.findAll({
      where: {
        status: {
          [Sequelize.Op.in]: [CASE_STATUSES.open, CASE_STATUSES.need_info],
        },
        spotterId: {
          [Sequelize.Op.not]: null,
        },
      },
      raw: true,
    });

    vehiclesInRepossessionHitList = vehiclesInRepossessionHitList.map((vehicle) => {
      const spotter = users.find((user) => user.id === vehicle.spotterId);

      return {
        ...vehicle,
        lat: vehicle.spottedLat,
        lng: vehicle.spottedLng,
        spotterFirstName: spotter.firstName,
        spotterLastName: spotter.firstName,
        spotterBranchName: spotter.branch.name,
        spotterAvatarUrl: spotter.avatarUrl,
      };
    });

    const totalRepossessionHitList = {
      'Company Wide': [],
      Unassigned: [],
    };

    branches.forEach((branch) => {
      totalRepossessionHitList[branch.name] = [];
    });

    vehiclesInRepossessionHitList.forEach((vehicle) => {
      const insighttBranchId = Object.keys(Utils.__BRANCH_IDS__[company.dbName]).find((id) =>
        Utils.__BRANCH_IDS__[company.dbName][id].includes(vehicle.spottedBranchId),
      );

      const insighttBranchName = branches.find((branch) => branch.id == insighttBranchId)?.name ?? 'Unassigned';

      totalRepossessionHitList['Company Wide'].push(vehicle);
      totalRepossessionHitList[insighttBranchName].push(vehicle);
    });

    const [hit, scan] = await Promise.all([
      CameraHit.findAll({
        where: {
          scannedAt: {
            [Sequelize.Op.gte]: moment(workingHoursStartTime).utc().format('YYYY-MM-DD'),
            [Sequelize.Op.lte]: moment(workingHoursEndTime).utc().format('YYYY-MM-DD'),
          },
        },
        raw: true,
      }),
      CameraScan.findAll({
        where: {
          scannedAt: {
            [Sequelize.Op.gte]: moment(workingHoursStartTime).utc().format('YYYY-MM-DD'),
            [Sequelize.Op.lte]: moment(workingHoursEndTime).utc().format('YYYY-MM-DD'),
          },
        },
        raw: true,
      }),
    ]);

    const hits = {};
    const scans = {};

    branches.forEach((branch) => {
      hits[branch.name] = { count: 0 };
      scans[branch.name] = { count: 0 };
    });
    scan.forEach((scan) => {
      const user = users.find((user) => user.drnId?.toLowerCase() === scan.drnId?.toLowerCase());

      if (!user) return;

      scans[user.branchName].count += scan.count;
    });

    hit.forEach((hit) => {
      const user = users.find((user) => user.drnId?.toLowerCase() === hit.drnId?.toLowerCase());

      if (!user) return;

      hits[user.branchName].count += hit.count;
    });

    peopleInActiveShifts = peopleInActiveShifts.map((shiftTime) => ({
      ...shiftTime,
      infractions: infractions.filter((infraction) => infraction.shiftTimeId === shiftTime.id).length,
      commissionCount: 0,
      involuntaryRepossessionsCount: cases.filter(
        (vehicle) =>
          (vehicle.repoAgentRdnId === shiftTime.user.rdnId || vehicle.spotterId === shiftTime.user.id) &&
          INVOLUNTARY_ORDER_TYPES.includes(vehicle.orderType),
      ).length,
      totalRepossessionsCount: cases.filter(
        (vehicle) =>
          vehicle.repoAgentRdnId === (shiftTime.user.rdnId || vehicle.spotterId === shiftTime.user.id) &&
          [CASE_STATUSES.repossessed].includes(vehicle.status),
      ).length,
      totalVehiclesCount: cases.filter(
        (vehicle) => vehicle.repoAgentRdnId === shiftTime.user.rdnId || vehicle.spotterId === shiftTime.user.id,
      ).length,
    }));

    return {
      totalRepossessions,
      peopleInActiveShifts,
      activeShifts,
      totalSpottedVehicles,
      totalLPRScans: hits,
      Scans: scans,
      totalUnitsPendingRepossessions,
      commissionsForActiveShifts: [],
      totalRepossessionHitList,
    };
  };

  const shiftAlertsFeed = async (company, shiftFeeds, activeShifts) => {
    const { ShiftTime, BreakTime, TimeClock, UserCommission, Location } =
      await companyService().getCompanyDatabase(company.dbName);
    const shiftService = require('./shift.service');
    const shiftFeed = [];
    await Promise.all(
      map(shiftFeeds, async (feed) => {
        if (!isEmpty(feed.type)) {
          if (
            feed.category === SHIFT_FEED_CATEGORIES.infraction &&
            moment(feed.createdAt).isBefore(moment(activeShifts[0].startTime))
          ) {
            feed.isOverDue = true;
          }

          feed.color = NOTIFICATION_COLOR[feed.type] || NOTIFICATION_COLOR.default;
          if (feed.type === SHIFT_FEED_TYPES.location_value_invalid) {
            feed.details = {
              lat: 0,
              lng: 0,
              location: 'Unknown Location',
            };
          }

          if (feed.type === SHIFT_FEED_TYPES.shift_start_later || feed.type === SHIFT_FEED_TYPES.shift_end_early) {
            const shiftTime = await ShiftTime.findOne({
              where: {
                id: feed.objectId,
              },
              raw: true,
            });

            if (shiftTime) {
              feed = await shiftService().getFeedOrInfractionDetails(feed, shiftTime, company);
            } else {
              feed.details = {
                lat: 0,
                lng: 0,
                location: 'Unknown Location',
                infractionTimes: 0,
              };
            }
          }
          if (
            feed.type === SHIFT_FEED_TYPES.shift_inactivity ||
            feed.type === SHIFT_FEED_TYPES.shift_being_idle ||
            feed.type === SHIFT_FEED_TYPES.shift_being_offline ||
            feed.type === SHIFT_FEED_TYPES.shift_being_idle_offline ||
            feed.type === SHIFT_FEED_TYPES.shift_break_start ||
            feed.type === SHIFT_FEED_TYPES.shift_break_over_time ||
            feed.type === SHIFT_FEED_TYPES.shift_pause_start
          ) {
            const breakTime = await BreakTime.findOne({
              attributes: ['type', 'startTime', 'endTime', 'lat', 'lng', 'location', 'note'],
              where: {
                id: feed.objectId,
              },
              include: [
                {
                  model: TimeClock,
                  as: 'timeClock',
                  attributes: ['name', 'allowedTime'],
                },
                {
                  model: Location,
                  as: 'locationMeta',
                  attributes: ['lat', 'lng', 'address'],
                },
              ],
              raw: true,
              next: true,
            });
            feed.details = breakTime || {};
          }
          if (feed.type === SHIFT_FEED_TYPES.custom_commission_request) {
            const commissionRequest = await UserCommission.findOne({
              attributes: ['amount', 'note'],
              where: {
                id: feed.objectId,
                commissionType: COMMISSION_TYPES.custom,
                commissionStatus: COMMISSION_STATUSES.pending,
              },
            });
            feed.details = commissionRequest || {};
          }
          shiftFeed.push(feed);
        }
      }),
    );

    return shiftFeed;
  };

  return {
    saveAllUserInfractionAsRecord,
    autoSaveInfraction,
    getUnitsPendingRepossessions,
    getActiveShiftsOverviewV2,
    shiftAlertsFeed,
  };
};

module.exports = shiftAdminService;
