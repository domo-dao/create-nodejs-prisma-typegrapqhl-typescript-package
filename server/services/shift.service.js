const httpStatus = require('http-status');
const Sequelize = require('sequelize');
const { map, filter, forEach, find, findIndex, uniqBy, get, pick, isEmpty, uniq } = require('lodash');
const moment = require('moment');
const locationService = require('./location.service');
const shiftAdminService = require('./shift-admin.service');
const reportService = require('./report.service');
const alertService = require('./alert.service');
const mailService = require('../services/mail.service');
const mapService = require('../services/map.service');
const { checkIsVoluntaryRepossession } = require('../rdn/util');
const Utils = require('../utils/util');
const rdnEndpoints = require('../rdn/endpoints');
const {
  SHIFT_TYPES,
  SHIFT_AVAILABLE_LIMIT_TIME_HOURS,
  SPOTTED_VEHICLE_DISTANCE_FOR_NEARBY_AGENTS,
  RECOVERY_AGENT,
  SPOTTER,
  CAMERA_CAR,
  SHIFT_FEED_TYPES,
  INFRACTION_TYPES,
  BREAK_TIME_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
  SHIFT_FEED_CATEGORIES,
  MINIMUM_METER_FOR_ONE_SECOND,
  NOTIFY_TYPE,
  DRIVER_ROLE,
  NOTIFICATION_TEXTS,
  NOTIFICATION_DESCRIPTIONS,
  DEVICE_TYPES,
  SHIFT_STATUSES,
  ALLOWED_INACTIVE_OR_MOTION_LIMIT_OVER_SHIFT_TIME,
  TIME_CLOCK_TYPES,
  SUPER_ADMIN_ROLE,
  USER_ACTIVITIES,
  PUSH_NOTIFICATION_TTL,
  UNKNOWN_BRANCH_ID,
  // WORKER_TASKS,
  USER_STATUS,
  EMAIL_SUBJECT_NAMES,
  EMAIL_TEMPLATE_NAMES,
  SPOTTED_VEHICLE,
} = require('../constants/app.constants');
const { CASE_STATUSES, CASE_ORDER_TYPES, VOLUNTARY_ORDER_TYPES } = require('../rdn/constants');
const db = require('../database/models');
const messageConstants = require('../constants/message.constants');
const APIError = require('../utils/APIError');
const { messaging } = require('firebase-admin');
const { serverLogger } = require('../config/logger');
const userService = require('./user.service');
const { getCaseValidAddresses } = require('../rdn/util');
const { v4: uuidv4 } = require('uuid');
const {
  validateIfManualTimeShiftIsOverTime,
  validateIfNormalShiftIsOverTime,
} = require('../helpers/shift.helper');
const { RDN_ERRORS } = require('../../server/rdn/constants');

const shiftService = () => {
  const companyService = require('./company.service');
  const getShiftWorkHours = (shift) => {
    if (!shift) {
      return null;
    }
    if (!shift.startTime || !shift.endTime) {
      return null;
    }

    let { startTime, endTime } = shift;

    if (moment().valueOf() > moment(endTime).valueOf()) {
      startTime = moment(startTime).add(1, 'days').format();
      endTime = moment(endTime).add(1, 'days').format();
    } else {
      const startShiftTimeForPrevPeriod = moment(startTime).subtract(1, 'day').format();
      const endShiftTimeForPrevPeriod = moment(endTime).subtract(1, 'day').format();
      if (
        Utils.timeDiffAsSeconds(moment().format(), startShiftTimeForPrevPeriod) >= 0 &&
        Utils.timeDiffAsSeconds(moment().format(), endShiftTimeForPrevPeriod) <= 0
      ) {
        startTime = startShiftTimeForPrevPeriod;
        endTime = endShiftTimeForPrevPeriod;
      }
    }

    return {
      startTime,
      endTime,
    };
  };

  const getDateRangeForReposOnShift = (shiftTime, shiftWorkHours) => {
    const dateRange = {
      startTime:
        moment(shiftTime.startTime).diff(moment(shiftWorkHours.startTime), 'seconds') > 0
          ? shiftTime.startTime
          : shiftWorkHours.startTime,
      endTime:
        moment(shiftTime.endTime || moment().format()).diff(moment(shiftWorkHours.endTime), 'seconds') > 0
          ? shiftWorkHours.endTime
          : shiftTime.endTime || moment().format(),
    };

    return dateRange;
  };

  const getTeamShiftTimesOnShift = async (shiftId, shiftWorkHours, dbName) => {
    const { User, ShiftTime, Branch } = await companyService().getCompanyDatabase(dbName);
    const teamShiftTimes = await ShiftTime.findAll({
      where: {
        shiftId,
        startTime: {
          [Sequelize.Op.gte]: moment(shiftWorkHours.startTime)
            .subtract(SHIFT_AVAILABLE_LIMIT_TIME_HOURS, 'hours')
            .format(),
        },
        endTime: {
          [Sequelize.Op.or]: [
            {
              [Sequelize.Op.eq]: null,
            },
            {
              [Sequelize.Op.lte]: moment(shiftWorkHours.endTime)
                .add(SHIFT_AVAILABLE_LIMIT_TIME_HOURS, 'hours')
                .format(),
            },
          ],
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'rdnId',
            'roleId',
            'branchId',
            'firstName',
            'lastName',
            'phoneNumber',
            'email',
            'avatarUrl',
          ],
          include: [
            {
              model: Branch,
              as: 'branch',
            },
          ],
        },
      ],
      order: [['startTime', 'ASC']],
      raw: true,
      nest: true,
    });

    return teamShiftTimes;
  };

  const getIndiviualShiftTimesOnShift = async (shiftId, userId, shiftWorkHours, dbName) => {
    const { User, ShiftTime, Branch } = await companyService().getCompanyDatabase(dbName);
    const indiviualShiftTimes = await ShiftTime.findAll({
      where: {
        shiftId,
        userId,
        startTime: {
          [Sequelize.Op.gte]: moment(shiftWorkHours.startTime)
            .subtract(SHIFT_AVAILABLE_LIMIT_TIME_HOURS, 'hours')
            .format(),
        },
        [Sequelize.Op.or]: [
          {
            endTime: {
              [Sequelize.Op.lte]: moment(shiftWorkHours.endTime)
                .add(SHIFT_AVAILABLE_LIMIT_TIME_HOURS, 'hours')
                .format(),
            },
          },
          {
            endTime: {
              [Sequelize.Op.eq]: null,
            },
          },
        ],
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'rdnId',
            'roleId',
            'branchId',
            'firstName',
            'lastName',
            'phoneNumber',
            'email',
            'avatarUrl',
          ],
          include: [
            {
              model: Branch,
              as: 'branch',
            },
          ],
        },
      ],
      order: [['startTime', 'ASC']],
      raw: true,
      nest: true,
    });

    return indiviualShiftTimes;
  };

  const getActivePeopleInShift = async (shiftId, shiftWorkHours, dbName) => {
    const teamShiftTimes = await getTeamShiftTimesOnShift(shiftId, shiftWorkHours, dbName);
    const activeShiftTimes = filter(teamShiftTimes, (shiftTime) => !shiftTime.endTime);
    const activePeopleInShift = uniqBy(activeShiftTimes, (shiftTime) => shiftTime.user.id);

    return activePeopleInShift;
  };

  const getOverShiftTimesOnShift = async (dbName) => {
    const { User, ShiftTime } = await companyService().getCompanyDatabase(dbName);
    const onGoingShiftTimes = await ShiftTime.findAll({
      where: {
        shiftType: SHIFT_TYPES.normal_shift,
        endTime: {
          [Sequelize.Op.eq]: null,
        },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'rdnId', 'roleId', 'firstName', 'lastName', 'phoneNumber', 'email'],
        },
      ],
    });

    const overShiftTimes = filter(onGoingShiftTimes, (shiftTime) =>
      validateIfNormalShiftIsOverTime(moment(), shiftTime),
    );

    return overShiftTimes;
  };

  const getOverShiftTimesOnShiftManualTime = async (dbName) => {
    const { ShiftTime } = await companyService().getCompanyDatabase(dbName);
    const onGoingManualTimeShiftTimes = await ShiftTime.findAll({
      where: {
        shiftType: SHIFT_TYPES.extraneous_time_tracked,
        endTime: {
          [Sequelize.Op.eq]: null,
        },
      },
    });

    const overShiftTimes = filter(onGoingManualTimeShiftTimes, (shiftTime) =>
      validateIfManualTimeShiftIsOverTime(moment(), shiftTime),
    );

    return overShiftTimes;
  };

  const getIndividualRepossessionsForAgent = async (user, shiftTime, shiftWorkHours, dbName) => {
    const { Case } = await companyService().getCompanyDatabase(dbName);
    const dateRange = getDateRangeForReposOnShift(shiftTime, shiftWorkHours);
    const totalVehicles = await Case.findAll({
      attributes: ['caseId', 'orderType', 'repoDate', 'vin', 'yearMakeModel', 'vehicleColor'],
      where: {
        repoAgentRdnId: user.rdnId,
        status: {
          [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
        },
        repoDate: {
          [Sequelize.Op.gte]: dateRange.startTime,
          [Sequelize.Op.lte]: dateRange.endTime,
        },
      },
      order: [['repoDate', 'DESC']],
      raw: true,
    });

    // there are 3 types of account orders - Involuntary, Voluntary, Investigate/Repo
    // Investigate/Repo is a wrong assigned case, so we treat that as Voluntary
    const involuntaryRepossessions = filter(
      totalVehicles,
      (_case) => _case.orderType === CASE_ORDER_TYPES.involuntary,
    );

    return {
      totalVehicles,
      totalRepossessionsCount: totalVehicles.length,
      involuntaryRepossessionsCount: involuntaryRepossessions.length,
    };
  };

  const getIndividualRepossessionsForSpotter = async (
    user,
    shiftTime,
    shiftWorkHours,
    dbName,
    checkRepossessed = true,
  ) => {
    const { Case } = await companyService().getCompanyDatabase(dbName);
    const dateRange = getDateRangeForReposOnShift(shiftTime, shiftWorkHours);
    const totalVehicles = await Case.findAll({
      attributes: [
        'caseId',
        'status',
        'orderType',
        'vin',
        'yearMakeModel',
        'vehicleColor',
        'spottedDate',
        'spottedNote',
        'spottedAddress',
      ],
      where: {
        spotterId: user.id,
        ...(checkRepossessed && {
          status: {
            [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
          },
        }),
        spottedDate: {
          [Sequelize.Op.gte]: dateRange.startTime,
          [Sequelize.Op.lte]: dateRange.endTime,
        },
      },
      order: [['spottedDate', 'ASC']],
      raw: true,
    });

    // there are 3 types of account orders - Involuntary, Voluntary, Investigate/Repo
    // Investigate/Repo is a wrong assigned case, so we treat that as Voluntary
    const totalRepossessions = filter(totalVehicles, (_case) => _case.status === CASE_STATUSES.repossessed);
    const involuntaryRepossessions = filter(
      totalRepossessions,
      (_case) => _case.orderType === CASE_ORDER_TYPES.involuntary,
    );

    return {
      totalVehicles,
      totalRepossessionsCount: totalRepossessions.length,
      involuntaryRepossessionsCount: involuntaryRepossessions.length,
    };
  };

  const getIndividualRepossessionsForNonDriver = async (user, shiftTime, shiftWorkHours, dbName) => {
    const { Case } = await companyService().getCompanyDatabase(dbName);
    const dateRange = getDateRangeForReposOnShift(shiftTime, shiftWorkHours);
    const totalVehicles = await Case.findAll({
      attributes: ['caseId', 'orderType', 'repoDate', 'vin', 'yearMakeModel', 'vehicleColor'],
      where: {
        repoAgentRdnId: user.rdnId,
        status: {
          [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
        },
        repoDate: {
          [Sequelize.Op.gte]: dateRange.startTime,
          [Sequelize.Op.lte]: dateRange.endTime,
        },
      },
      order: [['repoDate', 'DESC']],
      raw: true,
    });

    // there are 3 types of account orders - Involuntary, Voluntary, Investigate/Repo
    // Investigate/Repo is a wrong assigned case, so we treat that as Voluntary
    const involuntaryRepossessions = filter(
      totalVehicles,
      (_case) => _case.orderType === CASE_ORDER_TYPES.involuntary,
    );

    return {
      totalVehicles,
      totalRepossessionsCount: totalVehicles.length,
      involuntaryRepossessionsCount: involuntaryRepossessions.length,
    };
  };

  const getIndividualRepossessionsOnPrevShift = async (user, shiftId, shiftWorkHours, dbName) => {
    const { Role, ShiftTime } = await companyService().getCompanyDatabase(dbName);
    const userRole = await Role.findOne({
      where: {
        id: user.roleId,
      },
    });

    const shiftTimesOnPrevShift = await ShiftTime.findAll({
      where: {
        userId: user.id,
        shiftId,
        startTime: {
          [Sequelize.Op.gte]: moment(shiftWorkHours.startTime).subtract(SHIFT_AVAILABLE_LIMIT_TIME_HOURS, 'hours'),
        },
        endTime: {
          [Sequelize.Op.or]: [
            {
              [Sequelize.Op.eq]: null,
            },
            {
              [Sequelize.Op.lte]: moment(shiftWorkHours.endTime).add(SHIFT_AVAILABLE_LIMIT_TIME_HOURS, 'hours'),
            },
          ],
        },
      },
    });

    const repossessionsOnPrevShift = {
      totalRepossessionsCount: 0,
      involuntaryRepossessionsCount: 0,
    };
    await Promise.all(
      map(shiftTimesOnPrevShift, async (shiftTime) => {
        let repossessionsOnShiftTime = {};
        if (userRole.type === RECOVERY_AGENT) {
          repossessionsOnShiftTime = await shiftService().getIndividualRepossessionsForAgent(
            user,
            shiftTime,
            shiftWorkHours,
            dbName,
          );
        } else if (userRole.type === SPOTTER) {
          repossessionsOnShiftTime = await shiftService().getIndividualRepossessionsForSpotter(
            user,
            shiftTime,
            shiftWorkHours,
            dbName,
          );
        } else if (userRole.type === CAMERA_CAR) {
          // Get Scanned Vehicles later
        } else {
          // For other groups' users (like Branch Manager, Administrator - non driver user group)
          // Get only repossessed vehicles (no need involuntary vehicles
          // actually when create a shift, admin set only total-vehicles, no involuntary for Branch managers, Administrators)
          repossessionsOnShiftTime = await shiftService().getIndividualRepossessionsForNonDriver(
            user,
            shiftTime,
            shiftWorkHours,
            dbName,
          );
        }

        repossessionsOnPrevShift.totalRepossessionsCount =
          repossessionsOnPrevShift.totalRepossessionsCount + repossessionsOnShiftTime.totalRepossessionsCount || 0;

        repossessionsOnPrevShift.involuntaryRepossessionsCount =
          repossessionsOnPrevShift.involuntaryRepossessionsCount +
            repossessionsOnShiftTime.involuntaryRepossessionsCount || 0;
      }),
    );

    return repossessionsOnPrevShift;
  };

  const getIndividualRepossessionsOnTeam = async (teamShiftTimes, shiftWorkHours, dbName) => {
    const { Role } = await companyService().getCompanyDatabase(dbName);
    const peopleIndividualRepossessions = [];
    await Promise.all(
      map(teamShiftTimes, async (individualShiftTime) => {
        const { user } = individualShiftTime;
        const userRole = await Role.findOne({
          where: {
            id: user.roleId,
          },
        });

        let repossessionsOnCurrentShift = {};
        if (userRole.type === RECOVERY_AGENT) {
          repossessionsOnCurrentShift = await shiftService().getIndividualRepossessionsForAgent(
            user,
            individualShiftTime,
            shiftWorkHours,
            dbName,
          );
        } else if (userRole.type === SPOTTER) {
          repossessionsOnCurrentShift = await shiftService().getIndividualRepossessionsForSpotter(
            user,
            individualShiftTime,
            shiftWorkHours,
            dbName,
          );
        } else if (userRole.type === CAMERA_CAR) {
          // Get Scanned Vehicles later
          repossessionsOnCurrentShift = {
            totalVehicles: [],
            totalRepossessionsCount: 0,
            involuntaryRepossessionsCount: 0,
          };
        } else {
          // For other groups' users (like Branch Manager, Administrator - non driver user group)
          // Get only repossessed vehicles (no need involuntary vehicles
          // actually when create a shift, admin set only total-vehicles, no involuntary for Branch managers, Administrators)
          repossessionsOnCurrentShift = await shiftService().getIndividualRepossessionsForNonDriver(
            user,
            individualShiftTime,
            shiftWorkHours,
            dbName,
          );
        }

        const doubledUserRepossessions = find(
          peopleIndividualRepossessions,
          (individual) => individual.user.id === user.id,
        );
        if (doubledUserRepossessions) {
          const { totalVehicles, totalRepossessionsCount, involuntaryRepossessionsCount } =
            doubledUserRepossessions.repossessionsOnCurrentShift;

          const sumOfRepossessionsOnCurrentShift = {
            totalVehicles: [...totalVehicles, ...(repossessionsOnCurrentShift.totalVehicles || [])],
            totalRepossessionsCount:
              totalRepossessionsCount + (repossessionsOnCurrentShift.totalRepossessionsCount || 0),
            involuntaryRepossessionsCount:
              involuntaryRepossessionsCount + (repossessionsOnCurrentShift.involuntaryRepossessionsCount || 0),
          };

          const idx = findIndex(peopleIndividualRepossessions, (individual) => individual.user.id === user.id);
          if (idx > -1)
            peopleIndividualRepossessions[idx] = {
              repossessionsOnCurrentShift: sumOfRepossessionsOnCurrentShift,
              user: doubledUserRepossessions.user,
            };
        } else {
          peopleIndividualRepossessions.push({
            repossessionsOnCurrentShift,
            user: {
              ...user,
              role: userRole,
            },
          });
        }
      }),
    );

    return peopleIndividualRepossessions;
  };

  const getTeamRepossessionsOnShift = async (shiftId, shiftWorkHours, company, shiftTimes = []) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    let teamShiftTimes = shiftTimes;

    if (!shiftTimes.length) {
      teamShiftTimes = await getTeamShiftTimesOnShift(shiftId, shiftWorkHours, company.dbName);
    }
    if (!teamShiftTimes.length) {
      return {
        totalRepossessions: [],
        totalRepossessionsCount: 0,
        involuntaryRepossessionsCount: 0,
      };
    }

    let totalRepossessions = [];
    await Promise.all(
      map(teamShiftTimes, async (individualShiftTime) => {
        const dateRange = getDateRangeForReposOnShift(individualShiftTime, shiftWorkHours);
        const individualRepossessions = await Case.findAll({
          attributes: [
            'caseId',
            'repoAgentRdnId',
            'orderType',
            'repoDate',
            'repoAddress',
            'vin',
            'yearMakeModel',
            'vehicleColor',
            'lenderClientName',
            'spottedDate',
          ],
          where: {
            repoAgentRdnId: individualShiftTime.user.rdnId,
            status: {
              [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
            },
            repoDate: {
              [Sequelize.Op.gte]: dateRange.startTime,
              [Sequelize.Op.lte]: dateRange.endTime,
            },
          },
          order: [['repoDate', 'DESC']],
          raw: true,
        });
        individualRepossessions.map((individualRepossession) => {
          individualRepossession.user = individualShiftTime.user;
        });
        totalRepossessions = [...totalRepossessions, ...individualRepossessions];
      }),
    );

    await Promise.all(
      map(totalRepossessions, async (repo) => {
        const geoLocation = await locationService().getOrSetAddress(repo.repoAddress, company);
        repo.repoGeoLocation = geoLocation;
        return repo;
      }),
    );

    // there are 3 types of account orders - Involuntary, Voluntary, Investigate/Repo
    // Investigate/Repo is a wrong assigned case, so we treat that as Voluntary
    const involuntaryRepossessions = filter(
      totalRepossessions,
      (_case) => _case.orderType === CASE_ORDER_TYPES.involuntary,
    );

    return {
      totalRepossessions,
      totalRepossessionsCount: totalRepossessions.length,
      involuntaryRepossessionsCount: involuntaryRepossessions.length,
    };
  };

  const getIndividualRepossessionsOnShift = async (shiftId, userId, shiftWorkHours, company, shiftTimes = []) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    let indiviualShiftTimes = shiftTimes;

    if (!shiftTimes.length) {
      indiviualShiftTimes = await getIndiviualShiftTimesOnShift(shiftId, userId, shiftWorkHours, company.dbName);
    }
    if (!indiviualShiftTimes.length) {
      return {
        totalRepossessions: [],
        totalRepossessionsCount: 0,
        involuntaryRepossessionsCount: 0,
      };
    }
    let totalRepossessions = [];
    await Promise.all(
      map(indiviualShiftTimes, async (individualShiftTime) => {
        const dateRange = getDateRangeForReposOnShift(individualShiftTime, shiftWorkHours);
        const individualRepossessions = await Case.findAll({
          attributes: [
            'caseId',
            'repoAgentRdnId',
            'orderType',
            'repoDate',
            'repoAddress',
            'vin',
            'yearMakeModel',
            'vehicleColor',
            'lenderClientName',
            'spottedDate',
          ],
          where: {
            repoAgentRdnId: individualShiftTime.user.rdnId,
            status: {
              [Sequelize.Op.in]: [CASE_STATUSES.repossessed],
            },
            repoDate: {
              [Sequelize.Op.gte]: dateRange.startTime,
              [Sequelize.Op.lte]: dateRange.endTime,
            },
          },
          order: [['repoDate', 'DESC']],
          raw: true,
        });

        totalRepossessions = [...totalRepossessions, ...individualRepossessions];
      }),
    );

    await Promise.all(
      map(totalRepossessions, async (repo) => {
        const geoLocation = await locationService().getOrSetAddress(repo.repoAddress, company);
        repo.repoGeoLocation = geoLocation;
        return repo;
      }),
    );

    // there are 3 types of account orders - Involuntary, Voluntary, Investigate/Repo
    // Investigate/Repo is a wrong assigned case, so we treat that as Voluntary
    const involuntaryRepossessions = filter(
      totalRepossessions,
      (_case) => _case.orderType === CASE_ORDER_TYPES.involuntary,
    );

    return {
      totalRepossessions,
      totalRepossessionsCount: totalRepossessions.length,
      involuntaryRepossessionsCount: involuntaryRepossessions.length,
    };
  };

  const getIndividualSpottedOnShift = async (shiftId, userId, shiftWorkHours, company, shiftTimes = []) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    let indiviualShiftTimes = shiftTimes;

    if (!shiftTimes.length) {
      indiviualShiftTimes = await getIndiviualShiftTimesOnShift(shiftId, userId, shiftWorkHours, company.dbName);
    }
    if (!indiviualShiftTimes.length) {
      return {
        totalRepossessions: [],
        totalRepossessionsCount: 0,
        involuntaryRepossessionsCount: 0,
      };
    }
    let totalSpotted = [];
    await Promise.all(
      map(indiviualShiftTimes, async (individualShiftTime) => {
        const dateRange = getDateRangeForReposOnShift(individualShiftTime, shiftWorkHours);
        const individualSpotted = await Case.findAll({
          attributes: [
            'caseId',
            'spotterId',
            'orderType',
            'spottedDate',
            'spottedAddress',
            'vin',
            'yearMakeModel',
            'vehicleColor',
            'lenderClientName',
          ],
          where: {
            spotterId: individualShiftTime.user.id,
            spottedDate: {
              [Sequelize.Op.gte]: dateRange.startTime,
              [Sequelize.Op.lte]: dateRange.endTime,
            },
          },
          order: [['spottedDate', 'DESC']],
          raw: true,
        });

        totalSpotted = [...totalSpotted, ...individualSpotted];
      }),
    );

    await Promise.all(
      map(totalSpotted, async (repo) => {
        const geoLocation = await locationService().getOrSetAddress(repo.repoAddress, company);
        repo.repoGeoLocation = geoLocation;
        return repo;
      }),
    );

    // there are 3 types of account orders - Involuntary, Voluntary, Investigate/Repo
    // Investigate/Repo is a wrong assigned case, so we treat that as Voluntary
    const involuntaryRepossessions = filter(
      totalSpotted,
      (_case) => _case.orderType === CASE_ORDER_TYPES.involuntary,
    );

    return {
      totalRepossessions: totalSpotted,
      totalRepossessionsCount: totalSpotted.length,
      involuntaryRepossessionsCount: involuntaryRepossessions.length,
    };
  };

  const getTeamSpottedVehiclesOnShift = async (shiftId, shiftWorkHours, company, shiftTimes = []) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    let teamShiftTimes = shiftTimes;

    if (!shiftTimes.length) {
      teamShiftTimes = await getTeamShiftTimesOnShift(shiftId, shiftWorkHours, company.dbName);
    }
    if (!teamShiftTimes.length) {
      return {
        totalSpottedVehicles: [],
        totalSpottedVehiclesCount: 0,
      };
    }

    let totalSpottedVehicles = [];
    await Promise.all(
      map(teamShiftTimes, async (individualShiftTime) => {
        const dateRange = getDateRangeForReposOnShift(individualShiftTime, shiftWorkHours);
        const individualSpottedVehicles = await Case.findAll({
          attributes: [
            'caseId',
            'spotterId',
            'spottedDate',
            'spottedNote',
            'spottedAddress',
            'status',
            'orderType',
            'vin',
            'yearMakeModel',
            'vehicleColor',
            'lenderClientName',
          ],
          where: {
            spotterId: individualShiftTime.user.id,
            spottedDate: {
              [Sequelize.Op.gte]: dateRange.startTime,
              [Sequelize.Op.lte]: dateRange.endTime,
            },
          },
          order: [['spottedDate', 'ASC']],
          raw: true,
        });

        totalSpottedVehicles = [...totalSpottedVehicles, ...individualSpottedVehicles];
      }),
    );

    await Promise.all(
      map(totalSpottedVehicles, async (vehicle) => {
        const geoLocation = await locationService().getOrSetAddress(vehicle.spottedAddress, company);
        vehicle.spottedGeoLocation = geoLocation;
        return vehicle;
      }),
    );

    return {
      totalSpottedVehicles,
      totalSpottedVehiclesCount: totalSpottedVehicles.length,
    };
  };

  const getUnitsPendingRepossessionsOnShift = async (shiftId, shiftWorkHours, company, shiftTimes = []) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    let teamShiftTimes = shiftTimes;

    if (!shiftTimes.length) {
      teamShiftTimes = await getTeamShiftTimesOnShift(shiftId, shiftWorkHours, company.dbName);
    }
    if (!teamShiftTimes.length) {
      return [];
    }

    let unitsPendingRepossessions = [];
    await Promise.all(
      map(teamShiftTimes, async (individualShiftTime) => {
        const dateRange = getDateRangeForReposOnShift(individualShiftTime, shiftWorkHours);
        const individualUnits = await Case.findAll({
          attributes: [
            'caseId',
            'vin',
            'orderType',
            'yearMakeModel',
            'vehicleColor',
            'lenderClientName',
            'spotterId',
            'spottedDate',
            'spottedNote',
            'spottedAddress',
          ],
          where: {
            spotterId: individualShiftTime.user.id,
            status: {
              [Sequelize.Op.in]: [CASE_STATUSES.open, CASE_STATUSES.need_info],
            },
            spottedDate: {
              [Sequelize.Op.gte]: dateRange.startTime,
              [Sequelize.Op.lte]: dateRange.endTime,
            },
          },
          order: [['spottedDate', 'DESC']],
          raw: true,
        });
        individualUnits.map((individualUnit) => {
          individualUnit.user = individualShiftTime.user;
        });
        unitsPendingRepossessions = [...unitsPendingRepossessions, ...individualUnits];
      }),
    );

    await Promise.all(
      map(unitsPendingRepossessions, async (vehicle) => {
        const geoLocation = await locationService().getOrSetAddress(vehicle.spottedAddress, company);
        vehicle.spottedGeoLocation = geoLocation;
        return vehicle;
      }),
    );

    return unitsPendingRepossessions;
  };

  const getIndiviualUnitsPendingRepossessionsOnShift = async (
    shiftId,
    userId,
    shiftWorkHours,
    company,
    shiftTimes = [],
  ) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    let indiviualShiftTimes = shiftTimes;

    if (!shiftTimes.length) {
      indiviualShiftTimes = await getIndiviualShiftTimesOnShift(shiftId, userId, shiftWorkHours, company.dbName);
    }
    if (!indiviualShiftTimes.length) {
      return [];
    }

    let unitsPendingRepossessions = [];
    await Promise.all(
      map(indiviualShiftTimes, async (individualShiftTime) => {
        const dateRange = getDateRangeForReposOnShift(individualShiftTime, shiftWorkHours);
        const individualUnits = await Case.findAll({
          attributes: [
            'caseId',
            'vin',
            'orderType',
            'yearMakeModel',
            'vehicleColor',
            'lenderClientName',
            'spotterId',
            'spottedDate',
            'spottedNote',
            'spottedAddress',
          ],
          where: {
            spotterId: individualShiftTime.user.id,
            status: {
              [Sequelize.Op.in]: [CASE_STATUSES.open, CASE_STATUSES.need_info],
            },
            spottedDate: {
              [Sequelize.Op.gte]: dateRange.startTime,
              [Sequelize.Op.lte]: dateRange.endTime,
            },
          },
          order: [['spottedDate', 'DESC']],
          raw: true,
        });
        individualUnits.map((individualUnit) => {
          individualUnit.user = individualShiftTime.user;
        });

        unitsPendingRepossessions = [...unitsPendingRepossessions, ...individualUnits];
      }),
    );

    await Promise.all(
      map(unitsPendingRepossessions, async (vehicle) => {
        const geoLocation = await locationService().getOrSetAddress(vehicle.spottedAddress, company);
        vehicle.spottedGeoLocation = geoLocation;
        return vehicle;
      }),
    );

    return unitsPendingRepossessions;
  };

  const getIndividualCommissionOnShift = async (shiftId, user, dbName) => {
    const { IndividualCommission } = await companyService().getCompanyDatabase(dbName);
    let individualCommissionOnShift = {
      vehicles: 0,
      involuntaryVehicles: 0,
      amount: 0,
    };

    const individualCommissionForUser = await IndividualCommission.findOne({
      where: {
        shiftId,
        userId: user.id,
      },
    });
    if (individualCommissionForUser) {
      individualCommissionOnShift = {
        vehicles: individualCommissionForUser.vehicles,
        involuntaryVehicles: individualCommissionForUser.involuntaryVehicles,
        amount: individualCommissionForUser.amount,
      };
    } else {
      const individualCommissionForUserGroup = await IndividualCommission.findOne({
        where: {
          shiftId,
          userGroupId: user.roleId,
        },
      });
      if (individualCommissionForUserGroup) {
        individualCommissionOnShift = {
          vehicles: individualCommissionForUserGroup.vehicles,
          involuntaryVehicles: individualCommissionForUserGroup.involuntaryVehicles,
          amount: individualCommissionForUserGroup.amount,
        };
      }
    }

    return individualCommissionOnShift;
  };

  const getTeamCommissionOnShift = async (shiftId, dbName) => {
    const { TeamCommission } = await companyService().getCompanyDatabase(dbName);
    const teamCommissionOnShift = [];
    const teamCommissions = await TeamCommission.findAll({
      where: {
        shiftId,
      },
      order: [['tier', 'ASC']],
    });
    forEach(teamCommissions, (teamCommission) => {
      const commission = teamCommission.sanitized();
      teamCommissionOnShift.push({
        tier: commission.tier,
        repossessionGoals: commission.repossessionGoals,
        commissions: commission.commissions,
      });
    });

    return teamCommissionOnShift;
  };

  const getPerVehicleCommissionOnShift = async (shiftId, user, dbName) => {
    const { PerVehicleCommission } = await companyService().getCompanyDatabase(dbName);
    let perVehicleCommissionOnShift = {
      amountForInvoluntary: 0,
      amountForVoluntary: 0,
    };

    const perVehicleCommissionForUser = await PerVehicleCommission.findOne({
      where: {
        shiftId,
        userId: user.id,
      },
    });
    if (perVehicleCommissionForUser) {
      perVehicleCommissionOnShift = {
        amountForInvoluntary: perVehicleCommissionForUser.amountForInvoluntary,
        amountForVoluntary: perVehicleCommissionForUser.amountForVoluntary,
      };
    } else {
      const perVehicleCommissionForUserGroup = await PerVehicleCommission.findOne({
        where: {
          shiftId,
          userGroupId: user.roleId,
        },
      });
      if (perVehicleCommissionForUserGroup) {
        perVehicleCommissionOnShift = {
          amountForInvoluntary: perVehicleCommissionForUserGroup.amountForInvoluntary,
          amountForVoluntary: perVehicleCommissionForUserGroup.amountForVoluntary,
        };
      }
    }

    return perVehicleCommissionOnShift;
  };

  const getAmountForIndividualCommission = (repoCounts, individualCommissionOnShift) => {
    const { totalRepossessionsCount, involuntaryRepossessionsCount } = repoCounts;
    const {
      vehicles: vehiclesGoal,
      involuntaryVehicles: involuntaryVehiclesGoal,
      amount,
    } = individualCommissionOnShift;

    if (!vehiclesGoal) {
      // no individual commission on shift
      return { amount: 0, hittingCount: 0 };
    }

    if (involuntaryRepossessionsCount >= involuntaryVehiclesGoal) {
      const hittingCount = Math.floor(totalRepossessionsCount / vehiclesGoal);
      return { amount: hittingCount * amount, hittingCount };
    } else {
      return { amount: 0, hittingCount: 0 };
    }
  };

  const getTierCommissionForTeam = (repoCounts, peopleInShift, teamCommissionOnShift) => {
    const { totalRepossessionsCount, involuntaryRepossessionsCount } = repoCounts;

    let tierCommissionForTeam = {
      tier: 0,
      commissions: [],
    };
    for (let tierIndex = 0; tierIndex < teamCommissionOnShift.length; tierIndex++) {
      const tierCommission = teamCommissionOnShift[tierIndex];
      const { tier, repossessionGoals, commissions } = tierCommission;
      const tierGoalsForPeopleInShift = repossessionGoals[peopleInShift];

      if (!tierGoalsForPeopleInShift) break;

      const { vehicles: vehiclesGoal, involuntaryVehicles: involuntaryVehiclesGoal } = tierGoalsForPeopleInShift;

      if (involuntaryRepossessionsCount >= Number(involuntaryVehiclesGoal)) {
        if (totalRepossessionsCount >= Number(vehiclesGoal)) {
          tierCommissionForTeam = {
            tier,
            commissions,
          };
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return tierCommissionForTeam;
  };

  const getAmountForTeamCommission = (tierCommissions, user) => {
    const commissionForUser = find(tierCommissions, (tc) => tc.userId === user.id);
    if (commissionForUser) {
      return commissionForUser.amount || 0;
    } else {
      const commissionForUserGroup = find(tierCommissions, (tc) => tc.userGroupId === user.roleId);
      if (commissionForUserGroup) {
        return commissionForUserGroup.amount || 0;
      } else {
        return 0;
      }
    }
  };

  const getAmountForPerVehicleCommission = (repoCounts, perVehicleCommissionOnShift) => {
    const { totalRepossessionsCount, involuntaryRepossessionsCount } = repoCounts;
    const { amountForInvoluntary, amountForVoluntary } = perVehicleCommissionOnShift;

    const voluntaryRepossessionsCount = totalRepossessionsCount - involuntaryRepossessionsCount;
    return involuntaryRepossessionsCount * amountForInvoluntary + voluntaryRepossessionsCount * amountForVoluntary;
  };

  const getNearbyRecoveryAgents = async (shiftId, shiftWorkHours, spottedVehicleLocation, dbName) => {
    const { Role, Location, GeoLocation } = await companyService().getCompanyDatabase(dbName);
    const peopleInShift = await getActivePeopleInShift(shiftId, shiftWorkHours, dbName);

    const nearbyRecoveryAgents = [];
    await Promise.all(
      map(peopleInShift, async (individualShiftTime) => {
        const { user } = individualShiftTime;
        const userRole = await Role.findOne({
          where: {
            id: user.roleId,
          },
        });
        if (userRole.type === RECOVERY_AGENT) {
          const agentGeoLocation = await GeoLocation.findOne({
            where: {
              shiftTimeId: individualShiftTime.id,
            },
            include: [
              {
                model: Location,
                as: 'locationMeta',
                attributes: ['lat', 'lng', 'address'],
              },
            ],
            order: [['endTrackTime', 'DESC']],
          });

          const distanceBetweenDriverAndSpottedVehicleLocationInMeter = locationService().calculateDistance(
            {
              lat: get(agentGeoLocation, 'locationMeta.lat', 0),
              lng: get(agentGeoLocation, 'locationMeta.lng', 0),
            },
            spottedVehicleLocation,
          );
          const distanceInMiles = distanceBetweenDriverAndSpottedVehicleLocationInMeter * 0.000621;

          if (distanceInMiles <= SPOTTED_VEHICLE_DISTANCE_FOR_NEARBY_AGENTS) {
            nearbyRecoveryAgents.push(user);
          }
        }
      }),
    );

    return nearbyRecoveryAgents;
  };

  const getTotalDistanceCovered = async (shiftTimeId, currentCoords, lastUsedLocationForMotionTrack, dbName) => {
    const { GeoLocation } = await companyService().getCompanyDatabase(dbName);
    if (!lastUsedLocationForMotionTrack) {
      lastUsedLocationForMotionTrack = await GeoLocation.findOne({
        where: {
          shiftTimeId: shiftTimeId,
          usedForMotionTrack: true,
        },
        order: [['endTrackTime', 'DESC']],
      });
    }

    const prevCoords = {
      lat: lastUsedLocationForMotionTrack.lat,
      lng: lastUsedLocationForMotionTrack.lng,
    };
    const distances = await locationService().getDistances(
      [`${prevCoords.lat},${prevCoords.lng}`],
      [`${currentCoords.lat},${currentCoords.lng}`],
    );

    const geoLocationDistance = get(distances, 'rows[0].elements[0].distance.value', 0);
    return geoLocationDistance;
  };

  const getFeedOrInfractionDetails = async (infraction, shiftTime, company) => {
    const { Location, GeoLocation } = await companyService().getCompanyDatabase(company.dbName);
    let geoLocation = await GeoLocation.findOne({
      where: {
        shiftTimeId: shiftTime.id,
        ...(infraction.type === SHIFT_FEED_TYPES.shift_start_later
          ? {
              startOfRoute: true,
            }
          : {
              endOfRoute: true,
            }),
      },
      include: [
        {
          model: Location,
          as: 'locationMeta',
          attributes: ['lat', 'lng', 'address'],
        },
      ],
    });

    const geoCoords = {
      lat: get(geoLocation, 'locationMeta.lat', 0),
      lng: get(geoLocation, 'locationMeta.lng', 0),
    };

    if (geoLocation && !geoLocation.locationId) {
      const location = await locationService().getOrSetLocation(
        {
          ...geoCoords,
        },
        company,
      );
      geoLocation = {
        ...geoLocation,
        locationId: location && location.id,
        locationMeta: {
          ...(location && pick(location, ['lat', 'lng', 'address'])),
        },
      };
    }

    const infractionTimes =
      infraction.type === SHIFT_FEED_TYPES.shift_start_later
        ? Utils.timeDiffAsMinutes(shiftTime.startTime, shiftTime.shiftPeriodStartTime)
        : Utils.timeDiffAsMinutes(shiftTime.shiftPeriodEndTime, shiftTime.endTime);
    infraction.details = {
      ...geoCoords,
      location: get(geoLocation, 'locationMeta.address', 'Unknown Location'),
      infractionTimes,
    };
    return infraction;
  };

  const getInfractionDetails = async (infractions, company, currentShiftTime) => {
    const { ShiftTime, GeoLocation, BreakTime, TimeClock, Location } = await companyService().getCompanyDatabase(
      company.dbName,
    );
    await Promise.all(
      map(infractions, async (infraction) => {
        infraction.color = NOTIFICATION_COLOR[infraction.type] || NOTIFICATION_COLOR.default;

        if (infraction.type === INFRACTION_TYPES.location_value_invalid) {
          infraction.details = {
            lat: 0,
            lng: 0,
            location: 'Unknown Location',
          };
          infraction.text = 'Invalid Location';
        }
        if (
          ((currentShiftTime && currentShiftTime.shiftType === SHIFT_TYPES.normal_shift) || !currentShiftTime) &&
          (infraction.type === INFRACTION_TYPES.shift_start_later ||
            infraction.type === INFRACTION_TYPES.shift_end_early)
        ) {
          const shiftTime = await ShiftTime.findOne({
            where: {
              id: infraction.objectId,
            },
            raw: true,
          });

          if (shiftTime) {
            let geoLocation = await GeoLocation.findOne({
              where: {
                shiftTimeId: shiftTime.id,
                ...(infraction.type === INFRACTION_TYPES.shift_start_later
                  ? {
                      startOfRoute: true,
                    }
                  : {
                      endOfRoute: true,
                    }),
              },
              include: [
                {
                  model: Location,
                  as: 'locationMeta',
                  attributes: ['lat', 'lng', 'address'],
                },
              ],
            });

            const geoCoords = {
              lat: get(geoLocation, 'locationMeta.lat', 0),
              lng: get(geoLocation, 'locationMeta.lng', 0),
            };
            if (!geoLocation.locationId) {
              const location = await locationService().getOrSetLocation(
                {
                  ...geoCoords,
                },
                company,
              );
              geoLocation = {
                ...geoLocation,
                locationId: location && location.id,
                locationMeta: {
                  ...(location && pick(location, ['lat', 'lng', 'address'])),
                },
              };
            }
            const infractionTimes =
              infraction.type === INFRACTION_TYPES.shift_start_later
                ? Utils.timeDiffAsMinutes(shiftTime.startTime, shiftTime.shiftPeriodStartTime)
                : Utils.timeDiffAsMinutes(shiftTime.shiftPeriodEndTime, shiftTime.endTime);
            infraction.details = {
              startTime: shiftTime.startTime,
              endTime: shiftTime.endTime,
              ...geoCoords,
              location: get(geoLocation, 'locationMeta.address', 'Unknown Location'),
              infractionTimes,
            };
          } else {
            infraction.details = {
              startTime: null,
              endTime: null,
              lat: 0,
              lng: 0,
              location: 'Unknown Location',
              infractionTimes: 0,
            };
          }
          if (infraction.details.infractionTimes > 0) {
            const infractionTimesInTimeFormat = Utils.nonZeroSec2time(
              infraction.details.infractionTimes * 60,
              false,
            );
            infraction.text =
              infraction.type === INFRACTION_TYPES.shift_start_later
                ? `Started shift ${infractionTimesInTimeFormat.trim()} late`
                : `Started shift ${infractionTimesInTimeFormat.trim()} early`;
          } else {
            infraction.text =
              infraction.type === INFRACTION_TYPES.shift_start_later
                ? `Started shift late`
                : `Started shift early`;
          }
        }
        if (
          infraction.type === INFRACTION_TYPES.shift_inactivity ||
          infraction.type === INFRACTION_TYPES.shift_being_idle ||
          infraction.type === INFRACTION_TYPES.shift_break_over_time
        ) {
          const breakTime = await BreakTime.findOne({
            where: {
              id: infraction.objectId,
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
            attributes: ['startTime', 'endTime', 'note'],
          });
          infraction.details = breakTime || {};
          if (infraction.type === INFRACTION_TYPES.shift_inactivity) {
            infraction.text = 'Inactive';
          } else if (infraction.type === INFRACTION_TYPES.shift_being_idle) {
            infraction.text = 'Shift is idle';
          } else if (infraction.type === INFRACTION_TYPES.shift_break_over_time) {
            const breakInSeconds = Utils.timeDiffAsSeconds(breakTime.endTime, breakTime.startTime);
            infraction.text = `Took ${
              breakInSeconds > 0 ? Utils.nonZeroSec2time(breakInSeconds, false).trim() : `a`
            } long break`;
          }
        }
      }),
    );
    return infractions;
  };

  const getActiveShifts = async (company) => {
    const { Shift } = await companyService().getCompanyDatabase(company.dbName);
    const shifts = await Shift.findAll();
    const currentDateTime = moment().format();

    let activeShiftTimes = [];

    for (let shift of shifts) {
      const shiftWorkHours = shiftService().getShiftWorkHours(shift);

      if (!shiftWorkHours) {
        const err = {
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: messageConstants.SHIFT_WORKHOURS_NOT_FOUND,
        };
        throw new APIError(err);
      }

      const teamShiftTimes = await shiftService().getTeamShiftTimesOnShift(
        shift.id,
        shiftWorkHours,
        company.dbName,
      );

      activeShiftTimes.push(
        ...teamShiftTimes.filter((teamShiftTime) => teamShiftTime.status === SHIFT_STATUSES.working),
      );
    }

    return { activeShiftTimes, currentDateTime };
  };

  const checkMotionOnShifts = async (company, duringPathReconstruction = false) => {
    // TODO: check the logic on "getActiveShifts"
    // when we check this, and are sure that is working, we should use this in the "doTrackRdnActivities" periodic task
    const { activeShiftTimes, currentDateTime } = await getActiveShifts(company);
    const statuses = [];
    for (let activeShiftTime of activeShiftTimes) {
      if (activeShiftTime.userDeviceType === 'mobile') continue;
      try {
        const { allowedTime, isMotionTrackerEnabled } = await getShiftTimeClock(company, activeShiftTime);

        const { isIdle, isOffline, lastLocationUpdate } = await getIdleMotionStatus(
          company,
          activeShiftTime,
          currentDateTime,
          allowedTime,
          duringPathReconstruction,
        );
        if (isIdle) {
          await generateIdleMotionInfraction(
            company,
            activeShiftTime,
            allowedTime,
            lastLocationUpdate,
            currentDateTime,
            isOffline,
            duringPathReconstruction,
          );
        }

        if (moment().valueOf() > moment(activeShiftTime.shiftPeriodEndTime).valueOf()) {
          await endShiftWhenInactiveAfterShiftTime(activeShiftTime, currentDateTime, company);
        }

        statuses.push({
          activeShiftTime,
          allowedTime,
          isMotionTrackerEnabled,
          isIdle,
          lastLocationUpdate,
        });
      } catch (e) {
        serverLogger.log({
          operationName: 'doCheckMotionOnShifts',
          message: e.message,
          error: e,
          level: 'error',
        });
      }
    }

    if (statuses.length === 1) {
      return statuses[0];
    }

    return statuses;
  };

  const getSpottedVehicleByVin = async (company, requestData, userId) => {
    const { ShiftTime } = await companyService().getCompanyDatabase(company.dbName);

    if (requestData.shiftTimeId) {
      const shiftTime = await ShiftTime.findOne({
        where: {
          id: requestData.shiftTimeId,
        },
      });
      if (!shiftTime) {
        const err = {
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: messageConstants.USER_SHIFT_NOT_FOUND,
        };
        throw new APIError(err);
      }
    }

    const spottedCases = await getCasesByVin(company, requestData.vin);

    const spottedCase = spottedCases.find((spottedCase) =>
      [CASE_STATUSES.open, CASE_STATUSES.need_info].includes(spottedCase.status),
    );

    let caseStatuses = map(spottedCases, (spottedCase) => spottedCase.status);
    const caseIds = map(spottedCases, (spottedCase) => spottedCase.caseId);
    caseStatuses = uniq(caseStatuses);

    if (!spottedCase) {
      serverLogger.log({
        operationName: 'getSpottedVehicleByVin',
        message: 'Vin number already reported in DB',
        payload: { vin: requestData.vin, user: userId, caseStatuses, caseIds },
        level: 'error',
      });
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: `${messageConstants.VIN_NUMBER_ALREADY_REPORTED} with status ${caseStatuses.join()}`,
      };
      throw new APIError(err);
    }

    if (spottedCase && spottedCase.lenderClientName === RDN_ERRORS.CHASE_CASE) {
      serverLogger.log({
        operationName: 'getSpottedVehicleByVin',
        message: 'The case is a chase account',
        payload: { vin: requestData.vin, user: userId, caseStatuses, caseIds },
        level: 'error',
      });
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.CHASE_ACCOUNT_ERROR,
      };
      throw new APIError(err);
    }

    // fetching a case from RDN
    const rdnCase = await rdnEndpoints.getRDNCaseInfo(company, spottedCase.caseId);

    if (!rdnCase || !spottedCase.caseId) {
      serverLogger.log({
        operationName: 'getSpottedVehicleByVin',
        message: 'Case not found in RDN',
        payload: {
          vin: requestData.vin,
          user: userId,
          caseStatuses,
          caseId: spottedCase.caseId,
        },
        level: 'error',
      });
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.CASE_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }

    const statusInRDN = rdnCase.status?._text;

    if (statusInRDN && spottedCase.status !== statusInRDN) {
      spottedCase.status = statusInRDN;
      await spottedCase.save();

      if (statusInRDN !== CASE_STATUSES.open && statusInRDN !== CASE_STATUSES.need_info) {
        serverLogger.log({
          operationName: 'getSpottedVehicleByVin',
          message: 'Vin number already reported in RDN',
          payload: {
            vin: requestData.vin,
            user: userId,
            caseStatuses,
            caseId: spottedCase.caseId,
            statusInRDN,
          },
          level: 'error',
        });
        const err = {
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: `${messageConstants.VIN_NUMBER_ALREADY_REPORTED} with status ${statusInRDN}`,
        };
        throw new APIError(err);
      }
    }

    // RDN case has a recent addresses list from CP or updated on RDN itself
    const caseValidAddresses = getCaseValidAddresses(rdnCase);
    const allAvailableAddresses = spottedCase.spottedAddress
      ? uniq([...caseValidAddresses, spottedCase.spottedAddress])
      : caseValidAddresses;

    const validAddresses = [];
    await Promise.all(
      map(allAvailableAddresses, async (address) => {
        const geoLocation = await locationService().getOrSetAddress(address, company);
        validAddresses.push({
          addressId: uuidv4(),
          address,
          position: geoLocation,
        });
      }),
    );
    return {
      ...spottedCase.dataValues,
      validAddresses,
    };
  };

  const getIdleMotionStatus = async (
    company,
    activeShiftTime,
    currentDateTime,
    allowedTime,
    duringPathReconstruction = false,
  ) => {
    // TODO: Check for improvements
    const { GeoLocation } = await companyService().getCompanyDatabase(company.dbName);

    let notifyTypesToCheck = [NOTIFY_TYPE.idle_notify, NOTIFY_TYPE.idle_offline_notify];

    if (!duringPathReconstruction) {
      notifyTypesToCheck = [...notifyTypesToCheck, NOTIFY_TYPE.offline_notify];
    }
    const [firstLocationUpdate, lastLocationUpdate, lastInfractionUpdate, lastRoute, lastTrackpoints] =
      await Promise.all([
        GeoLocation.findOne({
          where: {
            endTrackTime: {
              [Sequelize.Op.lte]: currentDateTime,
            },
            shiftTimeId: activeShiftTime.id,
            startOfRoute: true,
          },
          raw: true,
        }),
        GeoLocation.findOne({
          where: {
            endTrackTime: {
              [Sequelize.Op.lte]: currentDateTime,
            },
            shiftTimeId: activeShiftTime.id,
            usedForMotionTrack: true,
          },
          raw: true,
          order: [['endTrackTime', 'DESC']],
        }),
        GeoLocation.findOne({
          where: {
            endTrackTime: {
              [Sequelize.Op.lte]: currentDateTime,
            },
            shiftTimeId: activeShiftTime.id,
            allowedIntervalCheckpoint: true,
            notifyType: {
              [Sequelize.Op.in]: notifyTypesToCheck,
            },
          },
          raw: true,
          order: [['endTrackTime', 'DESC']],
        }),
        GeoLocation.findAll({
          where: {
            shiftTimeId: activeShiftTime.id,
            endTrackTime: {
              [Sequelize.Op.lte]: currentDateTime,
              [Sequelize.Op.gte]: moment(currentDateTime).subtract(allowedTime, 'minutes').format(),
            },
          },
          attributes: [[Sequelize.fn('sum', Sequelize.col('distance')), 'distance']],
          raw: true,
        }),
        GeoLocation.findAll({
          where: {
            shiftTimeId: activeShiftTime.id,
            notifyType: {
              [Sequelize.Op.is]: null,
            },
            endTrackTime: {
              [Sequelize.Op.lte]: currentDateTime,
              [Sequelize.Op.gte]: moment(currentDateTime).subtract(2, 'minutes').subtract(30, 'seconds').format(),
            },
          },
          raw: true,
        }),
      ]);

    if (!allowedTime) {
      return {
        isIdle: false,
        isOffline: false,
        lastLocationUpdate,
      };
    }

    const isOffline = lastTrackpoints.length < 1;

    const now = moment(currentDateTime);

    const firstUpdateThen = moment(firstLocationUpdate.endTrackTime);
    const lastUpdateThen = moment(lastLocationUpdate.endTrackTime);
    const firstUpdateDiff = now.diff(firstUpdateThen, 'seconds');
    const lastUpdateDiff = now.diff(lastUpdateThen, 'seconds');

    let isIdle = lastUpdateDiff >= allowedTime * 60;

    if (firstUpdateDiff >= allowedTime * 60) {
      const hasNotMovedEnough = lastRoute?.[0].distance / (allowedTime * 60) < MINIMUM_METER_FOR_ONE_SECOND;

      isIdle = isIdle || hasNotMovedEnough;
    }

    if (lastInfractionUpdate) {
      const lastInfractionThen = moment(lastInfractionUpdate.endTrackTime);
      const lastInfractionDiff = now.diff(lastInfractionThen, 'seconds');

      isIdle = isIdle && lastInfractionDiff >= allowedTime * 60;
    }

    return {
      isIdle,
      isOffline,
      lastLocationUpdate,
    };
  };

  const getShiftMap = async (shiftTimeId, company) => {
    const { BreakTime, ShiftTime, Location, GeoLocation } = await companyService().getCompanyDatabase(
      company.dbName,
    );

    const shiftTime = await ShiftTime.findOne({
      where: {
        id: shiftTimeId,
      },
      raw: true,
    });

    if (!shiftTime) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.USER_SHIFT_NOT_FOUND,
      };
      throw new APIError(err);
    }

    const locations = await GeoLocation.findAll({
      where: {
        shiftTimeId: shiftTime.id,
      },
      raw: true,
      include: [{ model: Location, as: 'locationMeta' }],
    });
    const breakTimes = await BreakTime.findAll({
      where: {
        shiftTimeId: shiftTime.id,
        type: {
          [Sequelize.Op.in]: [BREAK_TIME_TYPES.idle, BREAK_TIME_TYPES.offline, BREAK_TIME_TYPES.idle_offline],
        },
      },
      raw: true,
    });

    return { locations, breakTimes };
  };

  const generateIdleMotionInfraction = async (
    company,
    activeShiftTime,
    allowedTime,
    lastLocationUpdate,
    currentDateTime,
    isOffline = false,
    duringPathReconstruction = false,
  ) => {
    let locationNotifyType = NOTIFY_TYPE.idle_notify;
    let breakTimeType = BREAK_TIME_TYPES.idle;
    let shiftFeedType = SHIFT_FEED_TYPES.shift_being_idle;

    if (isOffline) {
      locationNotifyType = NOTIFY_TYPE.offline_notify;
      breakTimeType = BREAK_TIME_TYPES.offline;
      shiftFeedType = SHIFT_FEED_TYPES.shift_being_offline;
    }

    if (duringPathReconstruction) {
      locationNotifyType = NOTIFY_TYPE.idle_offline_notify;
      breakTimeType = BREAK_TIME_TYPES.idle_offline;
      shiftFeedType = SHIFT_FEED_TYPES.shift_being_idle_offline;
    }

    const { BreakTime, GeoLocation } = await companyService().getCompanyDatabase(company.dbName);

    const location = await locationService().getOrSetLocation(
      {
        lat: lastLocationUpdate.lat,
        lng: lastLocationUpdate.lng,
      },
      company,
    );

    const idleLocation = await GeoLocation.create({
      shiftTimeId: activeShiftTime.id,
      lat: lastLocationUpdate.lat,
      lng: lastLocationUpdate.lng,
      startTrackTime: moment(currentDateTime).subtract(allowedTime, 'minutes').format(),
      endTrackTime: currentDateTime,
      createdAt: currentDateTime,
      locationId: location.id,
      notifyType: locationNotifyType,
      usedForMotionTrack: true,
      allowedIntervalCheckpoint: true,
      distance: 0,
      offline: isOffline,
    });
    const mapImage = await mapService().createAndSaveMap(
      [
        {
          lat: lastLocationUpdate.lat,
          lng: lastLocationUpdate.lng,
        },
      ],
      'break_time_' + activeShiftTime.id,
    );
    const idleBreak = await BreakTime.create({
      shiftTimeId: activeShiftTime.id,
      type: breakTimeType,
      startTime: idleLocation.startTrackTime,
      endTime: idleLocation.endTrackTime,
      createdAt: currentDateTime,
      lat: lastLocationUpdate.lat,
      lng: lastLocationUpdate.lng,
      location: location && location.address,
      locationId: location && location.id,
      mapImage,
    });

    const payloadForPushNotification = {
      id: idleBreak.id,
      userName: activeShiftTime.user.firstName + ' ' + activeShiftTime.user.lastName,
      startTime: idleLocation.startTrackTime,
      endTime: idleLocation.endTrackTime,
      lat: lastLocationUpdate.lat,
      lng: lastLocationUpdate.lng,
      location: get(location, 'address', 'Unknown Location'),
      description: NOTIFICATION_DESCRIPTIONS.shift_being_idle,
      colorCode: NOTIFICATION_COLOR.shift_being_idle,
    };

    // Alert user for being idle
    const notificationForUser = {
      userId: activeShiftTime.user.id,
      type: NOTIFICATION_TYPES.shift_being_idle,
      color: NOTIFICATION_COLOR.shift_being_idle,
      text: NOTIFICATION_TEXTS.shift_being_idle,
      notifyForUserId: activeShiftTime.user.id,
      shiftTimeId: activeShiftTime.id,
    };
    const payloadForUser = {
      title: NOTIFICATION_TEXTS.shift_being_idle,
      body: {
        type: NOTIFICATION_TYPES.shift_being_idle,
        category: NOTIFICATION_CATEGORIES.for_user,
        message: NOTIFICATION_TEXTS.shift_being_idle,
        details: payloadForPushNotification,
      },
    };

    //TODO: create a different function service, that receives the map that we already created
    const notifyFeed = await alertService().notifyShiftFeed(
      {
        userId: activeShiftTime.user.id,
        objectId: idleBreak.id, // In this case, this is a BreakTime reference
        category: SHIFT_FEED_CATEGORIES.infraction,
        type: shiftFeedType,
      },
      company,
      lastLocationUpdate,
    );

    // Alert managers for being idle
    const notificationForManagers = {
      type: NOTIFICATION_TYPES.shift_being_idle,
      color: NOTIFICATION_COLOR.shift_being_idle,
      text: `Being Idle`,
      notifyForUserId: activeShiftTime.user.id,
      shiftTimeId: activeShiftTime.id,
    };
    const payloadForManagers = {
      title: NOTIFICATION_TEXTS.shift_being_idle,
      body: {
        type: NOTIFICATION_TYPES.shift_being_idle,
        category: NOTIFICATION_CATEGORIES.for_manager,
        message: `${activeShiftTime.user.firstName + ' ' + activeShiftTime.user.lastName}'s Being Idle`,
        details: {
          ...payloadForPushNotification,
          shiftFeedId: notifyFeed.id,
        },
      },
    };

    await idleLocation.save();
    await idleBreak.save();

    if (!isOffline && !duringPathReconstruction) {
      await alertService().notifyUser(activeShiftTime.user, notificationForUser, payloadForUser, company);
      await alertService().notifyManagers(
        activeShiftTime.user,
        notificationForManagers,
        payloadForManagers,
        company,
      );
    }

    await shiftAdminService().autoSaveInfraction(notifyFeed, company);
  };

  const getShiftTimeClock = async (company, activeShiftTime) => {
    const { TimeClock } = await companyService().getCompanyDatabase(company.dbName);

    const userGroupTimeClock = await TimeClock.findOne({
      where: {
        type: TIME_CLOCK_TYPES.motion_tracker,
        shiftId: activeShiftTime.shiftId,
        userGroupId: activeShiftTime.user.roleId,
        deletedAt: null,
      },
      raw: true,
    });

    if (!userGroupTimeClock) {
      return { allowedTime: null, isMotionTrackerEnabled: false };
    }

    return { ...userGroupTimeClock, isMotionTrackerEnabled: true };
  };

  const getMotionTrackerDetails = async (shiftId, userGroupId, dbName) => {
    const { TimeClock } = await companyService().getCompanyDatabase(dbName);
    return await TimeClock.findOne({
      where: {
        shiftId,
        userGroupId,
        type: TIME_CLOCK_TYPES.motion_tracker,
        deletedAt: null,
      },
    });
  };

  const notifyAdminAndManagersValidation = async (user, shiftTimeId, dbName) => {
    const { Role, ShiftTime, Session } = await companyService().getCompanyDatabase(dbName);
    let notifyUser = true;
    const [userRole, shiftTime] = await Promise.all([
      Role.findOne({
        where: {
          id: user.roleId,
        },
      }),
      ShiftTime.findOne({
        where: {
          id: shiftTimeId,
        },
      }),
    ]);

    if (!shiftTime) {
      notifyUser = false;
    } else {
      if (userRole.role !== DRIVER_ROLE) {
        const webUserToken = await Session.findOne({
          where: {
            userId: user.id,
            deviceToken: {
              [Sequelize.Op.eq]: shiftTime.userDeviceToken,
            },
            device: DEVICE_TYPES.web,
          },
          raw: true,
        });
        if (webUserToken) {
          notifyUser = false;
        }
      }
    }
    return notifyUser;
  };

  const endShiftWhenInactiveAfterShiftTime = async (shiftTime, currentDateTime, company) => {
    const { ShiftTime, GeoLocation, BreakTime } = await companyService().getCompanyDatabase(company.dbName);
    const lastTwoBreakTimesOfActiveShift = await BreakTime.findAll({
      where: {
        shiftTimeId: shiftTime.id,
      },
      order: [['createdAt', 'DESC']],
      limit: ALLOWED_INACTIVE_OR_MOTION_LIMIT_OVER_SHIFT_TIME,
    });
    let shiftInactiveCount = 0;
    lastTwoBreakTimesOfActiveShift.map((breakTimeOfActiveShift) => {
      if (
        breakTimeOfActiveShift.type === BREAK_TIME_TYPES.idle ||
        breakTimeOfActiveShift.type === BREAK_TIME_TYPES.inactivity
      ) {
        shiftInactiveCount++;
      }
    });
    if (shiftInactiveCount === ALLOWED_INACTIVE_OR_MOTION_LIMIT_OVER_SHIFT_TIME) {
      const lastGeoLocationRecord = await GeoLocation.findOne({
        where: {
          shiftTimeId: shiftTime.id,
        },
        order: [['endTrackTime', 'DESC']],
      });
      lastGeoLocationRecord.endOfRoute = true;
      // Send notification to a user
      const notification = {
        userId: shiftTime.user && shiftTime.user.id,
        type: NOTIFICATION_TYPES.shift_end_over_time,
        color: NOTIFICATION_COLOR.shift_end_over_time,
        text: "Your today's shift has been ended automatically",
        notifyForUserId: shiftTime.user && shiftTime.user.id,
      };
      const payload = {
        title: 'Shift Notification',
        body: {
          type: NOTIFICATION_TYPES.shift_end_over_time,
          message: "Your today's shift has been ended automatically",
        },
      };
      await Promise.all([
        lastGeoLocationRecord.save(),
        ShiftTime.update(
          {
            endTime: currentDateTime,
            status: SHIFT_STATUSES.ended,
          },
          {
            where: {
              id: shiftTime.id,
            },
          },
        ),
        alertService().notifyUser(shiftTime.user, notification, payload, company),
      ]);
    }
  };

  const getRepossessionHitList = async (branches, company, filterParams = null) => {
    let conditionalQuery = '';
    const branches_replacements = {};
    if (branches.length) {
      conditionalQuery = 'AND cases.spotted_branch_id in (:branches)';
      const branchIds = [];
      branches.map((branch) => {
        branchIds.push(...Utils.__BRANCH_NAME_WITH_SUB_BRANCH_IDS__[company.dbName][branch.name]);
      });
      branches_replacements.branches = branchIds.length ? branchIds : [''];
    }

    const sql = `
      SELECT
        cases.case_id as caseId,
        cases.vin as vin,
        cases.order_type as orderType,
        cases.year_make_model as yearMakeModel,
        cases.vehicle_color as vehicleColor,
        cases.lender_client_name as lenderClientName,
        cases.spotted_date as spottedDate,
        cases.spotted_note as spottedNote,
        cases.spotted_address as spottedAddress,
        cases.spotted_lat as lat,
        cases.spotted_lng as lng,
        b.name as spotterBranchName,
        users.id as spotterId,
        users.first_name as spotterFirstName,
        users.last_name as spotterLastName,
        users.avatar_url as spotterAvatarUrl
      FROM
        branches b,
        cases
      INNER JOIN
        users
      ON
        cases.spotter_id=users.id
      WHERE
        cases.spotted_date IS NOT NULL AND cases.status in (:statuses) AND
        b.id=users.branch_id
        ${conditionalQuery}
      ORDER BY
        cases.spotted_date
      ${filterParams ? `LIMIT :offset, :limit` : ''}
    `;
    const [totalRepossessionHitListCount, spottedCases] = await Promise.all([
      reportService().getRepossessionHitListCount(company.dbName, branches_replacements, conditionalQuery),
      db[`${company.dbName}_sequelize`].query(sql, {
        replacements: {
          statuses: [CASE_STATUSES.open, CASE_STATUSES.need_info],
          ...branches_replacements,
          ...(filterParams && {
            ...filterParams,
          }),
        },
        type: db[`${company.dbName}_sequelize`].QueryTypes.SELECT,
      }),
    ]);

    await Promise.all(
      spottedCases.map(async (spottedCase) => {
        spottedCase.isVolentory = VOLUNTARY_ORDER_TYPES.includes(spottedCase.orderType);
      }),
    );

    return {
      totalRepossessionHitListCount,
      spottedCases: spottedCases,
    };
  };

  const getSubBranchIdBasedOnAddress = async (
    zipCode,
    address,
    vendorBranchName,
    dbName,
    type = SPOTTED_VEHICLE,
  ) => {
    if (!zipCode) {
      // TODO: This needs to be unit tested
      const lastIndexOfComma = address.lastIndexOf(',');
      let digitsAfterLastComma = address.substring(lastIndexOfComma + 1);
      digitsAfterLastComma = digitsAfterLastComma.trim();
      if (!digitsAfterLastComma || isNaN(digitsAfterLastComma)) {
        const err = {
          success: false,
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: messageConstants.ZIP_CODE_REQUIRED,
        };
        return err;
      }
      zipCode = digitsAfterLastComma;
    }

    const { SubBranch } = await companyService().getCompanyDatabase(dbName);

    const subBranches = await SubBranch.findAll({
      where: {
        zipCodes: {
          [Sequelize.Op.like]: `%${zipCode}%`,
        },
      },
      raw: true,
    });

    const isZipCodeFound = find(subBranches, (subBranch) => !isEmpty(subBranch.zipCodes));
    let subBranchId;
    if (!subBranches.length || (subBranches.length && !isZipCodeFound)) {
      subBranchId = UNKNOWN_BRANCH_ID;
      serverLogger.info(`${type}, ${address}(${zipCode}) does not belongs to any branch`);
    } else {
      if (subBranches.length > 1) {
        const subBranchNames = map(subBranches, 'name');
        serverLogger.info(`${type}, ${address}(${zipCode}) belongs to many branches ${subBranchNames.join(', ')}`);
      }
      const matchedSubBranch = find(subBranches, (subBranch) => subBranch.name === vendorBranchName);

      if (matchedSubBranch) {
        subBranchId = matchedSubBranch.id;
      } else {
        subBranchId = subBranches[0].id;
      }
    }
    return { success: true, subBranchId: subBranchId };
  };

  const getSubBranchIdBasedOnAddressNew = async (
    zipCode,
    address,
    vendorBranchName,
    dbName,
    type = SPOTTED_VEHICLE,
  ) => {
    if (!zipCode) {
      // TODO: This needs to be unit tested
      const lastIndexOfComma = address.lastIndexOf(',');
      let digitsAfterLastComma = address.substring(lastIndexOfComma + 1);
      digitsAfterLastComma = digitsAfterLastComma.trim();
      if (!digitsAfterLastComma || isNaN(digitsAfterLastComma)) {
        const err = {
          success: false,
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: messageConstants.ZIP_CODE_REQUIRED,
        };
        return err;
      }
      zipCode = digitsAfterLastComma;
    }

    const { SubBranch } = await companyService().getCompanyDatabase(dbName);

    const subBranches = await SubBranch.findAll({
      where: {
        zipCodes: {
          [Sequelize.Op.like]: `%${zipCode}%`,
        },
      },
      raw: true,
    });

    const isZipCodeFound = find(subBranches, (subBranch) => !isEmpty(subBranch.zipCodes));
    let subBranch;
    if (!subBranches.length || (subBranches.length && !isZipCodeFound)) {
      subBranch = { id: UNKNOWN_BRANCH_ID };
      serverLogger.info(`${type}, ${address}(${zipCode}) does not belongs to any branch`);
    } else {
      if (subBranches.length > 1) {
        const subBranchNames = map(subBranches, 'name');
        serverLogger.info(`${type}, ${address}(${zipCode}) belongs to many branches ${subBranchNames.join(', ')}`);
      }
      const matchedSubBranch = find(subBranches, (subBranch) => subBranch.name === vendorBranchName);

      if (matchedSubBranch) {
        subBranch = matchedSubBranch;
      } else {
        subBranch = subBranches[0];
      }
    }
    return { success: true, subBranch: subBranch };
  };

  const getTotalCommission = async (branchId, replacements, dbName) => {
    const { Branch } = await companyService().getCompanyDatabase(dbName);
    let branchWhere = '';
    if (Number(branchId)) {
      const branch = await Branch.findOne({
        where: {
          id: branchId,
        },
      });
      branchWhere = `AND b.name in ('${branch.name}')`;
    }

    const totalSQL = `
      SELECT
        SUM(uc.amount) as total
      FROM user_commissions uc
      INNER JOIN users u ON uc.user_id=u.id
      INNER JOIN branches b ON u.branch_id=b.id
      WHERE
        commission_date>=:start AND commission_date<=:end AND commission_status=:status ${branchWhere}
    `;

    const totalAmount = await db[`${dbName}_sequelize`].query(totalSQL, {
      replacements,
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    return totalAmount[0].total || 0;
  };

  const getCommissionList = async (filterData, replacements, dbName) => {
    const { Branch } = await companyService().getCompanyDatabase(dbName);
    let branchWhere = '';
    if (Number(filterData.branchId)) {
      const branch = await Branch.findOne({
        where: {
          id: filterData.branchId,
        },
      });
      branchWhere = `AND b.name in ('${branch.name}')`;
    }

    let searchWhere = '';
    if (filterData.search) {
      searchWhere = `AND (u.first_name LIKE '%${filterData.search}%' or u.last_name LIKE '%${filterData.search}%' or uc.shift_name LIKE '%${filterData.search}%')`;
    }

    const tcSQL = `
      SELECT
        SUM(uc.amount) as total,
        COUNT(uc.id) as count
      FROM user_commissions uc
      INNER JOIN users u ON uc.user_id=u.id
      INNER JOIN branches b ON u.branch_id=b.id
      WHERE
        commission_date>=:start AND commission_date<=:end AND commission_status=:status AND commission_type=:type ${branchWhere} ${searchWhere}
    `;

    const commissionsSQL = `
      SELECT
        uc.user_id as userId,
        concat(u.first_name, ' ', u.last_name) as employee,
        uc.amount as amount,
        uc.note as note,
        uc.shift_name as shiftName,
        uc.commission_date as commissionDate,
        uc.commission_status as commissionStatus,
        uc.hitting_count_on_individual as hittingCountOnIndividual,
        uc.hitting_tier_on_team as hittingTierOnTeam,
        uc.involuntary_repos as involuntaryRepos,
        uc.voluntary_repos as voluntaryRepos,
        u.avatar_url as avatarUrl,
        b.name as branchName
      FROM user_commissions uc
      INNER JOIN users u ON uc.user_id=u.id
      INNER JOIN branches b ON u.branch_id=b.id
      WHERE
        commission_date>=:start AND commission_date<=:end AND commission_status=:status AND commission_type=:type ${branchWhere} ${searchWhere}
      ORDER BY
        uc.commission_date DESC
      LIMIT
        ${filterData.pageSize}
      OFFSET
        ${(filterData.currentPage - 1) * filterData.pageSize}
    `;

    const tc = await db[`${dbName}_sequelize`].query(tcSQL, {
      replacements,
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    const totalAmount = tc[0].total || 0;
    const totalItem = tc[0].count || 0;
    const totalPage =
      totalItem % filterData.pageSize === 0
        ? totalItem / filterData.pageSize
        : Math.floor(totalItem / filterData.pageSize) + 1;

    const commissions = await db[`${dbName}_sequelize`].query(commissionsSQL, {
      replacements,
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    return {
      totalAmount,
      totalItem,
      pageSize: Number(filterData.pageSize),
      currentPage: Number(filterData.currentPage),
      totalPage,
      commissions,
    };
  };

  const checkAuthorizeUserForShift = (userId, role, createrId) => {
    if (userId !== createrId && role !== SUPER_ADMIN_ROLE) {
      const err = {
        success: false,
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.YOU_ARE_NOT_AUTHORIZE_TO_DELETE_SHIFT,
      };

      return err;
    }

    return { success: true };
  };

  const deleteShift = async (shiftId, user, dbName) => {
    const {
      Shift,
      TimeClock,
      IndividualCommission,
      TeamCommission,
      PerVehicleCommission,
      UserActivity,
      ShiftTime,
    } = await companyService().getCompanyDatabase(dbName);

    const shift = await Shift.findOne({
      where: {
        id: shiftId,
      },
    });
    if (!shift) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.SHIFT_NOT_FOUND,
      };
      throw new APIError(err);
    }

    const isShiftCreater = await checkAuthorizeUserForShift(user.id, user.role.role, shift.createrId);
    if (!isShiftCreater || (isShiftCreater && !isShiftCreater.success)) {
      throw new APIError(isShiftCreater);
    }

    const activeShifts = await ShiftTime.findAll({
      where: {
        shiftId,
        endTime: {
          [Sequelize.Op.eq]: null,
        },
        status: SHIFT_STATUSES.working,
        shiftPeriodStartTime: {
          [Sequelize.Op.eq]: moment(shift.startTime).format('YYYY-MM-DD HH:mm:ss'),
        },
        shiftPeriodEndTime: {
          [Sequelize.Op.eq]: moment(shift.endTime).format('YYYY-MM-DD HH:mm:ss'),
        },
      },
    });

    if (activeShifts.length) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.CANNOT_DELETE_SHIFT,
      };
      throw new APIError(err);
    }

    await Promise.all([
      TimeClock.destroy({
        where: {
          shiftId,
        },
      }),

      IndividualCommission.destroy({
        where: {
          shiftId,
        },
      }),

      TeamCommission.destroy({
        where: {
          shiftId,
        },
      }),

      PerVehicleCommission.destroy({
        where: {
          shiftId,
        },
      }),

      Shift.destroy({
        where: {
          id: shiftId,
        },
      }),

      UserActivity.create({
        userId: user.id,
        updateNote: `has deleted shift ${
          shift && shift.name ? shift.name : ``
        } with it's related time clock and commissions`,
        type: USER_ACTIVITIES.shift,
        updateTime: moment().format(),
      }),
    ]);
  };

  const deleteShiftTeamCommissions = async (shiftId, user, dbName) => {
    const { Shift, TeamCommission, UserActivity } = await companyService().getCompanyDatabase(dbName);

    const shift = Shift.findOne({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.SHIFT_NOT_FOUND,
      };
      throw new APIError(err);
    }

    const isShiftCreater = await checkAuthorizeUserForShift(user.id, user.role.role, shift.createrId);
    if (!isShiftCreater || (isShiftCreater && !isShiftCreater.success)) {
      throw new APIError(isShiftCreater);
    }

    await Promise.all([
      TeamCommission.destroy({
        where: {
          shiftId,
        },
      }),
      UserActivity.create({
        userId: user.id,
        updateNote: `has deleted team commission for shift ${shift && shift.name ? shift.name : ``}`,
        type: USER_ACTIVITIES.commission,
        updateTime: moment().format(),
      }),
    ]);
  };

  const deleteShiftPerVehicleCommissions = async (shiftId, user, dbName) => {
    const { Shift, PerVehicleCommission, UserActivity } = await companyService().getCompanyDatabase(dbName);

    const shift = Shift.findOne({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.SHIFT_NOT_FOUND,
      };
      throw new APIError(err);
    }

    const isShiftCreater = await checkAuthorizeUserForShift(user.id, user.role.role, shift.createrId);
    if (!isShiftCreater || (isShiftCreater && !isShiftCreater.success)) {
      throw new APIError(isShiftCreater);
    }

    await Promise.all([
      PerVehicleCommission.destroy({
        where: {
          shiftId,
        },
      }),
      UserActivity.create({
        userId: user.id,
        updateNote: `has deleted per vehicle commission for shift ${shift && shift.name ? shift.name : ``}`,
        type: USER_ACTIVITIES.commission,
        updateTime: moment().format(),
      }),
    ]);
  };

  const deleteShiftIndividualCommissions = async (shiftId, user, dbName) => {
    const { Shift, IndividualCommission, UserActivity } = await companyService().getCompanyDatabase(dbName);

    const shift = Shift.findOne({
      where: {
        id: shiftId,
      },
    });

    if (!shift) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.SHIFT_NOT_FOUND,
      };
      throw new APIError(err);
    }

    const isShiftCreater = await checkAuthorizeUserForShift(user.id, user.role.role, shift.createrId);
    if (!isShiftCreater || (isShiftCreater && !isShiftCreater.success)) {
      throw new APIError(isShiftCreater);
    }

    await Promise.all([
      IndividualCommission.destroy({
        where: {
          shiftId,
        },
      }),
      UserActivity.create({
        userId: user.id,
        updateNote: `has deleted individual commission for shift ${shift && shift.name ? shift.name : ``}`,
        type: USER_ACTIVITIES.commission,
        updateTime: moment().format(),
      }),
    ]);
  };

  const notifyShiftCreationToUsers = async (company, name, branches, userGroups) => {
    const { User, Session } = await companyService().getCompanyDatabase(company.dbName);

    const userIDs = (
      await User.findAll({
        where: {
          branchId: {
            [Sequelize.Op.in]: branches,
          },
          roleId: {
            [Sequelize.Op.in]: userGroups,
          },
        },
        attributes: ['id'],
        raw: true,
      })
    ).map(({ id }) => id);
    const userTokens = (
      await Session.findAll({
        where: {
          userId: {
            [Sequelize.Op.in]: userIDs,
          },
        },
        raw: true,
      })
    )
      .filter(({ deviceToken }) => !!deviceToken)
      .map(({ deviceToken }) => deviceToken);

    const payload = {
      title: 'Insightt Push Notification',
      body: {
        type: NOTIFICATION_TYPES.shift_created,
        category: NOTIFICATION_CATEGORIES.for_user,
        message: `A new shift (${name}) is now available`,
      },
    };

    if (userTokens && userTokens.length > 0) {
      await messaging().sendMulticast({
        tokens: userTokens,
        data: {
          title: payload.title,
          body: JSON.stringify(payload.body),
        },
        notification: {
          title: payload.title,
          body: payload.body.message,
        },
        android: {
          notification: {
            sound: 'notification_sound.wav',
            channel_id: 'insightt_notification_channel',
          },
        },
        apns: {
          headers: {
            'apns-priority': '10',
          },
          payload: {
            aps: {
              sound: 'notification_sound.wav',
            },
          },
        },
        webpush: {
          headers: {
            TTL: PUSH_NOTIFICATION_TTL,
          },
        },
      });
    }
  };

  const sendMailToAdminsForDuplicateZipcode = async (dbName, duplicateZipCodeString) => {
    serverLogger.info(`===> Enter in Email sent to admin method for Duplicate Zipcode`);
    const { Role, User } = await companyService().getCompanyDatabase(dbName);

    const adminRoles = await Role.findAll({
      where: {
        role: SUPER_ADMIN_ROLE,
      },
    });
    const admins = await User.findAll({
      where: {
        roleId: {
          [Sequelize.Op.in]: adminRoles.map((role) => role.id),
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

    serverLogger.info(
      `Sending email Duplicate Zipcode for ${dbName} managers: ${admins.map(({ email }) => email)}`,
    );

    for (let admin of admins) {
      try {
        const mailConfig = await mailService().config({
          to: admin.email,
          subject: EMAIL_SUBJECT_NAMES.duplicateZipCodes,
          template: EMAIL_TEMPLATE_NAMES.duplicateZipCodes,
          templateOptions: {
            duplicateZipCodeString,
          },
        });

        await mailService().send(mailConfig);
        serverLogger.info(`===> Email sent to admin ${admin.email} for Duplicate Zipcode`);
      } catch (e) {
        serverLogger.log({
          operationName: 'sendMailError',
          message: `===> Error on admin when duplicate zip codes ${admin.email}: ${e}`,
          error: e,
          level: 'error',
        });
      }
    }
  };

  const sendMailToAdminsForMissedRepossessionsAlert = async (company, status, rdnCase) => {
    const isVoluntary = checkIsVoluntaryRepossession(rdnCase);
    serverLogger.info(`===> Enter in Email sent to admins and branch Manager for missessed repossession alert`);
    let spottedMainBranchId = -1;
    for (const [key] of Object.entries(Utils.__BRANCH_IDS__[company.dbName])) {
      if (Utils.__BRANCH_IDS__[company.dbName][key].includes(rdnCase.spottedBranchId)) {
        spottedMainBranchId = key;
      }
    }
    const adminsAndBranchManagers = await userService().getAdminsOrBranchManager(
      company.dbName,
      spottedMainBranchId,
    );
    const emailsTo = adminsAndBranchManagers.map((user) => user.email).join(',');
    try {
      const vin = rdnCase.vin.substr(rdnCase.vin.length - 6);
      const mailConfig = mailService().config({
        to: emailsTo,
        subject: `VIN: ${vin} - Missed ${isVoluntary ? 'Voluntary ' : ''}Repossession Alert`,
        template: EMAIL_TEMPLATE_NAMES.missedRepossessionAlert,
        templateOptions: {
          companyAdminName: rdnCase.lenderClientName || '',
          status,
          vin,
          caseId: rdnCase.caseId,
          companyName: company.name,
          isVoluntary,
        },
      });

      await mailService().send(mailConfig);
      serverLogger.info(`===> Email sent to admins and branch Manager ${emailsTo}`);
    } catch (e) {
      serverLogger.log({
        operationName: 'sendMailError',
        message: `===> Error on admins and branch Manager ${emailsTo} when missed repossession alert: ${e}`,
        error: e,
        level: 'error',
      });
      throw e;
    }
  };

  const getShiftEmptyReasonInfractions = async (userId, shiftTimeId, infractionType, dbName) => {
    const emptyReasonBreakInfractionSql = `
      SELECT sf.id,
        breakInfractions.lat, breakInfractions.lng, breakInfractions.address, breakInfractions.startTime, breakInfractions.endTime,
        u.id as user_id, u.first_name, u.last_name,
        sf.object_id, sf.type, sf.category
      FROM shift_feed sf
      INNER JOIN
        users u
      ON u.id=sf.user_id
      INNER JOIN
      (
        SELECT sf.id, l.lat, l.lng, l.address, bt.start_time as startTime, bt.end_time as endTime
        FROM
          shift_feed sf,
          break_times bt
        LEFT JOIN
          locations l
        ON l.id=bt.location_id
        WHERE
          bt.id=sf.object_id AND
          bt.shift_time_id=:shiftTimeId AND
          sf.type in (:breakInfractionTypes) AND
          sf.user_id=:userId AND
          (sf.reason is null OR sf.reason='')
          group by sf.id, l.lat, l.lng, l.address
          order by sf.created_at desc
      ) as breakInfractions
      ON sf.id=breakInfractions.id,
      roles r
      WHERE
        sf.user_id=:userId AND
        r.id=u.role_id AND r.role='${DRIVER_ROLE}' AND
        sf.type in (:breakInfractionTypes) AND
        (sf.reason is null OR sf.reason='')
      ORDER BY sf.created_at desc
      LIMIT 1
      `;

    const infractions = await db[`${dbName}_sequelize`].query(emptyReasonBreakInfractionSql, {
      replacements: {
        userId,
        shiftTimeId: shiftTimeId,
        breakInfractionTypes: [infractionType],
      },
      type: db[`${dbName}_sequelize`].QueryTypes.SELECT,
    });

    return infractions;
  };

  const getShiftEmptyReasonInfraction = (infractions, infractionType) => {
    const allowedInfractionTypes = [INFRACTION_TYPES.shift_being_idle, INFRACTION_TYPES.shift_inactivity];
    let infraction = undefined;

    if (allowedInfractionTypes.indexOf(infractionType) !== -1) {
      if (infractions.length > 0) {
        infraction = infractions.find((infraction) => infraction.type === infractionType);
      }

      if (infraction && infractionType === SHIFT_FEED_TYPES.shift_being_idle) {
        infraction.title = NOTIFICATION_TEXTS.shift_being_idle;
        infraction.description = NOTIFICATION_DESCRIPTIONS.shift_being_idle;
      }

      if (infraction && infractionType === SHIFT_FEED_TYPES.shift_inactivity) {
        infraction.title = NOTIFICATION_TEXTS.shift_inactivity;
        infraction.description = NOTIFICATION_DESCRIPTIONS.shift_inactivity;
      }
    }

    return infraction;
  };

  const getCasesByVin = async (company, vin) => {
    const { Case } = await companyService().getCompanyDatabase(company.dbName);
    const spottedCases = await Case.findAll({
      attributes: [
        'caseId',
        'status',
        'vin',
        'yearMakeModel',
        'vehicleColor',
        'spottedDate',
        'spottedAddress',
        'lenderClientName',
        'spotterId',
      ],
      where: {
        vin: {
          [Sequelize.Op.like]: `%${vin}`,
        },
      },
      order: [['orderDate', 'DESC']],
    });
    return spottedCases;
  };

  const getShiftsByBranchId = async (dbName, branchId) => {
    const { Shift } = await companyService().getCompanyDatabase(dbName);
    const shifts = await Shift.findAll({
      where: {
        branchId,
      },
    });
    return shifts;
  };

  return {
    getShiftWorkHours,
    getDateRangeForReposOnShift,
    getTeamShiftTimesOnShift,
    getActivePeopleInShift,
    getOverShiftTimesOnShift,
    getIndividualRepossessionsForAgent,
    getIndividualRepossessionsForSpotter,
    getIndividualRepossessionsForNonDriver,
    getIndividualRepossessionsOnPrevShift,
    getIndividualRepossessionsOnTeam,
    getTeamRepossessionsOnShift,
    getTeamSpottedVehiclesOnShift,
    getUnitsPendingRepossessionsOnShift,
    getIndividualCommissionOnShift,
    getTeamCommissionOnShift,
    getPerVehicleCommissionOnShift,
    getAmountForIndividualCommission,
    getTierCommissionForTeam,
    getAmountForTeamCommission,
    getAmountForPerVehicleCommission,
    getNearbyRecoveryAgents,
    getTotalDistanceCovered,
    getFeedOrInfractionDetails,
    getInfractionDetails,
    getIndiviualShiftTimesOnShift,
    getIndividualRepossessionsOnShift,
    getIndividualSpottedOnShift,
    getIndiviualUnitsPendingRepossessionsOnShift,
    getShiftTimeClock,
    getIdleMotionStatus,
    checkMotionOnShifts,
    getActiveShifts,
    getShiftMap,
    generateIdleMotionInfraction,
    notifyAdminAndManagersValidation,
    endShiftWhenInactiveAfterShiftTime,
    getMotionTrackerDetails,
    getRepossessionHitList,
    getSubBranchIdBasedOnAddress,
    getTotalCommission,
    getCommissionList,
    checkAuthorizeUserForShift,
    deleteShift,
    deleteShiftTeamCommissions,
    deleteShiftPerVehicleCommissions,
    deleteShiftIndividualCommissions,
    notifyShiftCreationToUsers,
    sendMailToAdminsForDuplicateZipcode,
    sendMailToAdminsForMissedRepossessionsAlert,
    getShiftEmptyReasonInfractions,
    getShiftEmptyReasonInfraction,
    getSpottedVehicleByVin,
    getOverShiftTimesOnShiftManualTime,
    getShiftsByBranchId,
    getSubBranchIdBasedOnAddressNew,
  };
};

module.exports = shiftService;
