const Sequelize = require('sequelize');
const { map, find, get, pick } = require('lodash');
const moment = require('moment');
const shiftService = require('../../services/shift.service');
const locationService = require('../../services/location.service');
const shiftAdminService = require('../../services/shift-admin.service');
const alertService = require('../../services/alert.service');
const mapService = require('../../services/map.service');
const commissionService = require('../../services/commission.service');
const { timeDiffAsMinutes } = require('../../utils/util');
const { cronShiftLogger } = require('../../config/logger');
const {
  COMMISSION_TYPES,
  SHIFT_STATUSES,
  BREAK_TIME_TYPES,
  TIME_CLOCK_TYPES,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
  SHIFT_RDN_TRACKER_START_LIMIT_MINUTES,
  SHIFT_FEED_CATEGORIES,
  SHIFT_FEED_TYPES,
  USER_ACTIVITIES,
  NOTIFICATION_TEXTS,
  NOTIFICATION_DESCRIPTIONS,
} = require('../../constants/app.constants');

const { closeManualShiftsInOvertime } = require('../../../shared/scripts/closeManualShiftsInOvertime');

const { closeNormalShiftsInOvertime } = require('../../../shared/scripts/closeNormalShiftsInOvertime');

const rdnActivitiesBetaTesters = new Set([
  'gantoreno@yopmail.com',
  'gantoreno+2@yopmail.com',
  'bhamilton@rapidrecoveryagency.com',
  'ijohnson1996@yahoo.com',
  'Jamilmejias6471@gmail.com',
  'gryschules@gmail.com',
  'Unsung.mute08@gmail.com',
  'dagreatest.him86@gmail.com',
  'doha_diciano@hotmail.com',
  'ampvtec2649@gmail.com',
  '6yvonne7@gmail.com',
  'd@rra.com',
  'b@rra.com',
  'dhaval@test.com',
  'rodolfofuertes13@gmail.com',
  'alacret@cobuildlab.com',
]);

const doCalcShiftCommissions = async (company) => {
  const companyService = require('../company.service');
  cronShiftLogger.info('doCalcShiftCommissions cron job');
  try {
    const { Shift, UserCommission, UserActivity } = await companyService().getCompanyDatabase(company.dbName);
    // TODO: We should exclude inactive Shifts
    const _shifts = await Shift.findAll();
    const shifts = _shifts.map((_shift) => _shift.sanitized());

    if (shifts.length) {
      await Promise.all(
        map(shifts, async (shift) => {
          const shiftWorkHours = shiftService().getShiftWorkHours(shift);
          if (
            shiftWorkHours &&
            moment().valueOf() >= moment(shiftWorkHours.startTime).valueOf() &&
            moment().valueOf() <= moment(shiftWorkHours.endTime).valueOf()
          ) {
            const teamShiftTimesOnShift = await shiftService().getTeamShiftTimesOnShift(
              shift.id,
              shiftWorkHours,
              company.dbName,
            );

            // Calc Individual & Per Vehicle Commissions
            const peopleIndividualRepossessions = await shiftService().getIndividualRepossessionsOnTeam(
              teamShiftTimesOnShift,
              shiftWorkHours,
              company.dbName,
            );
            await Promise.all(
              map(peopleIndividualRepossessions, async (individualRepo) => {
                const individualRepoCounts = {
                  totalRepossessionsCount: individualRepo.repossessionsOnCurrentShift
                    ? individualRepo.repossessionsOnCurrentShift.totalRepossessionsCount
                    : 0,
                  involuntaryRepossessionsCount: individualRepo.repossessionsOnCurrentShift
                    ? individualRepo.repossessionsOnCurrentShift.involuntaryRepossessionsCount
                    : 0,
                };
                const individualCommissionOnShift = await shiftService().getIndividualCommissionOnShift(
                  shift.id,
                  individualRepo.user,
                  company.dbName,
                );
                const { amount: amountForIndividualCommission, hittingCount: hittingCountOnIndividual } =
                  shiftService().getAmountForIndividualCommission(
                    individualRepoCounts,
                    individualCommissionOnShift,
                  );
                if (amountForIndividualCommission > 0) {
                  // Save User Individual Commission
                  const userIndividualCommission = await UserCommission.findOne({
                    where: {
                      userId: individualRepo.user.id,
                      shiftId: shift.id,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      commissionType: COMMISSION_TYPES.individual,
                    },
                  });
                  if (userIndividualCommission) {
                    cronShiftLogger.log({
                      operationName: 'doCalcShiftCommissions',
                      message: `Update Individual Commission for User ${individualRepo.user.firstName} ${individualRepo.user.lastName}`,
                      amount: amountForIndividualCommission,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      level: 'info',
                    });
                    let userActivityNote = '';
                    if (
                      userIndividualCommission.amount &&
                      amountForIndividualCommission &&
                      userIndividualCommission.amount.toString() !== amountForIndividualCommission.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed individual commission'
                      } amount`;
                      userIndividualCommission.amount = amountForIndividualCommission;
                    }
                    if (
                      userIndividualCommission.hittingCountOnIndividual &&
                      hittingCountOnIndividual &&
                      userIndividualCommission.hittingCountOnIndividual.toString() !==
                        hittingCountOnIndividual.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed individual commission'
                      } hitting count`;
                      userIndividualCommission.hittingCountOnIndividual = hittingCountOnIndividual;
                    }
                    if (
                      userIndividualCommission.involuntaryRepos &&
                      individualRepoCounts.involuntaryRepossessionsCount &&
                      userIndividualCommission.involuntaryRepos.toString() !==
                        individualRepoCounts.involuntaryRepossessionsCount.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed individual commission'
                      } involuntary repossessions Count`;
                      userIndividualCommission.involuntaryRepos =
                        individualRepoCounts.involuntaryRepossessionsCount;
                    }
                    const voluntaryRepossessionsCount =
                      individualRepoCounts.totalRepossessionsCount -
                      individualRepoCounts.involuntaryRepossessionsCount;
                    if (
                      userIndividualCommission.voluntaryRepos &&
                      voluntaryRepossessionsCount &&
                      userIndividualCommission.voluntaryRepos.toString() !== voluntaryRepossessionsCount.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed individual commission'
                      } voluntary repossessions Count`;
                      userIndividualCommission.voluntaryRepos = voluntaryRepossessionsCount;
                    }
                    if (userActivityNote) {
                      await Promise.all([
                        userIndividualCommission.save(),
                        UserActivity.create({
                          targetUserId: individualRepo.user.id,
                          updateNote: `${userActivityNote} of`,
                          type: USER_ACTIVITIES.commission,
                          updateTime: moment().format(),
                        }),
                      ]);
                    }
                  } else {
                    cronShiftLogger.log({
                      operationName: 'doCalcShiftCommissions',
                      message: `Create Individual Commission for User ${individualRepo.user.firstName} ${individualRepo.user.lastName}`,
                      amount: amountForIndividualCommission,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      level: 'info',
                    });
                    const commission = await UserCommission.create({
                      userId: individualRepo.user.id,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      commissionType: COMMISSION_TYPES.individual,
                      amount: amountForIndividualCommission,
                      hittingCountOnIndividual,
                      involuntaryRepos: individualRepoCounts.involuntaryRepossessionsCount,
                      voluntaryRepos:
                        individualRepoCounts.totalRepossessionsCount -
                        individualRepoCounts.involuntaryRepossessionsCount,
                    });
                    await commissionService().notifyNewCommission({
                      user: individualRepo.user,
                      commission: commission,
                      company,
                      text: `has new individual commission amount $${commission.amount}`,
                      shiftFeedType: SHIFT_FEED_TYPES.new_individual_commission,
                      notificationType: NOTIFICATION_TYPES.new_individual_commission,
                      notificationColor: NOTIFICATION_COLOR.custom_commission_request,
                    });
                  }
                }

                const perVehicleCommissionOnShift = await shiftService().getIndividualCommissionOnShift(
                  shift.id,
                  individualRepo.user,
                  company.dbName,
                );
                const amountForPerVehicleCommission = shiftService().getAmountForPerVehicleCommission(
                  individualRepoCounts,
                  perVehicleCommissionOnShift,
                );
                if (amountForPerVehicleCommission > 0) {
                  // Save User Per-Vehicle Commission
                  const userPerVehicleCommission = await UserCommission.findOne({
                    where: {
                      userId: individualRepo.user.id,
                      shiftId: shift.id,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      commissionType: COMMISSION_TYPES.per_vehicle,
                    },
                  });
                  if (userPerVehicleCommission) {
                    cronShiftLogger.log({
                      operationName: 'doCalcShiftCommissions',
                      message: `Update Per-Vehicle Commission for User ${individualRepo.user.firstName} ${individualRepo.user.lastName}`,
                      amount: amountForPerVehicleCommission,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      level: 'info',
                    });
                    let userActivityNote = '';
                    if (
                      userPerVehicleCommission.amount &&
                      amountForPerVehicleCommission &&
                      userPerVehicleCommission.amount.toString() !== amountForPerVehicleCommission.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed per vehicle commission'
                      } amount`;
                      userPerVehicleCommission.amount = amountForPerVehicleCommission;
                    }
                    if (
                      userPerVehicleCommission.involuntaryRepos &&
                      individualRepoCounts.involuntaryRepossessionsCount &&
                      userPerVehicleCommission.involuntaryRepos.toString() !==
                        individualRepoCounts.involuntaryRepossessionsCount.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed per vehicle commission'
                      } involuntary repossessions count`;
                      userPerVehicleCommission.involuntaryRepos =
                        individualRepoCounts.involuntaryRepossessionsCount;
                    }

                    const voluntaryRepos =
                      individualRepoCounts.totalRepossessionsCount -
                      individualRepoCounts.involuntaryRepossessionsCount;
                    if (
                      userPerVehicleCommission.voluntaryRepos &&
                      voluntaryRepos &&
                      userPerVehicleCommission.voluntaryRepos.toString() !== voluntaryRepos.toString()
                    ) {
                      userActivityNote += `${
                        userActivityNote ? ', ' : 'System has changed per vehicle commission'
                      } voluntary repossessions count`;
                      userPerVehicleCommission.voluntaryRepos = voluntaryRepos;
                    }
                    if (userActivityNote) {
                      await Promise.all([
                        userPerVehicleCommission.save(),
                        UserActivity.create({
                          targetUserId: individualRepo.user.id,
                          updateNote: `${userActivityNote} of`,
                          type: USER_ACTIVITIES.commission,
                          updateTime: moment().format(),
                        }),
                      ]);
                    }
                  } else {
                    cronShiftLogger.log({
                      operationName: 'doCalcShiftCommissions',
                      message: `Create Per-Vehicle Commission for User ${individualRepo.user.firstName} ${individualRepo.user.lastName}`,
                      amount: amountForPerVehicleCommission,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      level: 'info',
                    });
                    const commission = await UserCommission.create({
                      userId: individualRepo.user.id,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      commissionType: COMMISSION_TYPES.per_vehicle,
                      amount: amountForPerVehicleCommission,
                      involuntaryRepos: individualRepoCounts.involuntaryRepossessionsCount,
                      voluntaryRepos:
                        individualRepoCounts.totalRepossessionsCount -
                        individualRepoCounts.involuntaryRepossessionsCount,
                    });
                    await commissionService().notifyNewCommission({
                      user: individualRepo.user,
                      commission: commission,
                      company,
                      text: `has new vehicle commission amount $${commission.amount}`,
                      shiftFeedType: SHIFT_FEED_TYPES.new_vehicle_commission,
                      notificationType: NOTIFICATION_TYPES.new_vehicle_commission,
                      notificationColor: NOTIFICATION_COLOR.custom_commission_request,
                    });
                  }
                }
              }),
            );

            // Calc Team Commissions
            const teamRepossessionsOnCurrentShift = await shiftService().getTeamRepossessionsOnShift(
              shift.id,
              shiftWorkHours,
              company,
              teamShiftTimesOnShift,
            );
            const teamCommissionOnShift = await shiftService().getTeamCommissionOnShift(shift.id, company.dbName);
            const tierCommissionForTeam = shiftService().getTierCommissionForTeam(
              teamRepossessionsOnCurrentShift,
              peopleIndividualRepossessions.length,
              teamCommissionOnShift,
            );
            if (tierCommissionForTeam.tier) {
              const peopleInShift = map(peopleIndividualRepossessions, (individualRepo) => individualRepo.user);
              map(peopleInShift, async (user) => {
                const amountForTeamCommission = shiftService().getAmountForTeamCommission(
                  tierCommissionForTeam.commissions,
                  user,
                );
                if (amountForTeamCommission > 0) {
                  // Save User Team Commission
                  const userTeamCommission = await UserCommission.findOne({
                    where: {
                      userId: user.id,
                      shiftId: shift.id,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      commissionType: COMMISSION_TYPES.team,
                    },
                  });
                  if (userTeamCommission) {
                    cronShiftLogger.log({
                      operationName: 'doCalcShiftCommissions',
                      message: `Update Team Commission for User ${user.firstName} ${user.lastName}`,
                      amount: amountForTeamCommission,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      level: 'info',
                    });
                    userTeamCommission.amount = amountForTeamCommission;
                    userTeamCommission.hittingTierOnTeam = tierCommissionForTeam.tier;
                    userTeamCommission.involuntaryRepos =
                      teamRepossessionsOnCurrentShift.involuntaryRepossessionsCount;
                    userTeamCommission.voluntaryRepos =
                      teamRepossessionsOnCurrentShift.totalRepossessionsCount -
                      teamRepossessionsOnCurrentShift.involuntaryRepossessionsCount;
                    await userTeamCommission.save();
                  } else {
                    cronShiftLogger.log({
                      operationName: 'doCalcShiftCommissions',
                      message: `Create Team Commission for User ${user.firstName} ${user.lastName}`,
                      amount: amountForTeamCommission,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      level: 'info',
                    });
                    const commission = await UserCommission.create({
                      userId: user.id,
                      shiftId: shift.id,
                      shiftName: shift.name,
                      commissionDate: moment(shiftWorkHours.startTime).format(),
                      commissionType: COMMISSION_TYPES.team,
                      amount: amountForTeamCommission,
                      hittingTierOnTeam: tierCommissionForTeam.tier,
                      involuntaryRepos: teamRepossessionsOnCurrentShift.involuntaryRepossessionsCount,
                      voluntaryRepos:
                        teamRepossessionsOnCurrentShift.totalRepossessionsCount -
                        teamRepossessionsOnCurrentShift.involuntaryRepossessionsCount,
                    });
                    await commissionService().notifyNewCommission({
                      user: user,
                      commission: commission,
                      company,
                      text: `has new vehicle commission amount $${commission.amount}`,
                      shiftFeedType: SHIFT_FEED_TYPES.new_team_commission,
                      notificationType: NOTIFICATION_TYPES.new_team_commission,
                      notificationColor: NOTIFICATION_COLOR.custom_commission_request,
                    });
                  }
                }
              });
            }
          } else {
            return;
          }
        }),
      );
    }
  } catch (error) {
    cronShiftLogger.log({
      operationName: 'doCalcShiftCommissions',
      message: 'doCalcShiftCommissions cron job error',
      error: {
        message: error.message,
        stack: error.stack,
      },
      level: 'error',
    });
  }
};

const doTrackRdnActivities = async (company) => {
  // This import is done here due to circular dependency
  const companyService = require('../company.service');
  const { Shift, BreakTime, TimeClock, UserActivity, GeoLocation, Location } =
    await companyService().getCompanyDatabase(company.dbName);

  try {
    // TODO: use raw instead of sanitized
    // TODO filter for active Shifts
    const _shifts = await Shift.findAll();
    const shifts = _shifts.map((_shift) => _shift.sanitized());

    if (shifts.length === 0) return;

    await Promise.all(
      map(shifts, async (shift) => {
        const shiftWorkHours = shiftService().getShiftWorkHours(shift);
        if (shiftWorkHours.length === 0) return;

        //TODO: This "getActivePeopleInShift" needs to be reviewed
        const activePeopleInShift = await shiftService().getActivePeopleInShift(
          shift.id,
          shiftWorkHours,
          company.dbName,
        );
        const activityTrackersForShift = await TimeClock.findAll({
          where: {
            shiftId: shift.id,
            type: TIME_CLOCK_TYPES.activity_tracker,
          },
        });

        await Promise.all(
          map(activePeopleInShift, async (individualShiftTime) => {
            if (individualShiftTime.status !== SHIFT_STATUSES.working) return;

            const user = individualShiftTime.user;
            const activityTrackerForUserGroup = find(
              activityTrackersForShift,
              (tracker) => user && tracker.userGroupId === user.roleId,
            );

            if (activityTrackerForUserGroup && activityTrackerForUserGroup.allowedTime) {
              const userLastActivity = await UserActivity.findOne({
                where: {
                  userId: user.id,
                  updateTime: {
                    [Sequelize.Op.gte]: moment(shiftWorkHours.startTime).format(),
                  },
                },
                order: [['updateTime', 'DESC']],
                raw: true,
              });

              let isViolateIntervalTime = false;
              if (userLastActivity) {
                if (
                  timeDiffAsMinutes(moment(), userLastActivity.createdAt) > activityTrackerForUserGroup.allowedTime
                ) {
                  isViolateIntervalTime = true;
                }
              } else {
                if (
                  timeDiffAsMinutes(moment(), individualShiftTime.startTime) >
                  activityTrackerForUserGroup.allowedTime + SHIFT_RDN_TRACKER_START_LIMIT_MINUTES
                ) {
                  isViolateIntervalTime = true;
                }
              }

              if (isViolateIntervalTime) {
                let isInActivity = false;

                let inActivityStartTime = userLastActivity
                  ? moment(userLastActivity.createdAt).format()
                  : moment(individualShiftTime.startTime)
                      .add(SHIFT_RDN_TRACKER_START_LIMIT_MINUTES, 'minutes')
                      .format();

                const lastInfractionSinceLastActivity = await BreakTime.findOne({
                  where: {
                    shiftTimeId: individualShiftTime.id,
                    startTime: {
                      [Sequelize.Op.gte]: inActivityStartTime,
                    },
                    type: BREAK_TIME_TYPES.inactivity,
                  },
                  include: [
                    {
                      model: Location,
                      as: 'locationMeta',
                      attributes: ['lat', 'lng', 'address'],
                    },
                  ],
                  order: [['startTime', 'DESC']],
                });

                if (lastInfractionSinceLastActivity) {
                  if (
                    timeDiffAsMinutes(moment(), lastInfractionSinceLastActivity.createdAt) >=
                    activityTrackerForUserGroup.allowedTime
                  ) {
                    isInActivity = true;
                    inActivityStartTime = lastInfractionSinceLastActivity.endTime;
                  } else {
                    // no infraction because didn't reach out to next interval yet
                    isInActivity = false;
                  }
                } else {
                  isInActivity = true;
                }

                if (isInActivity) {
                  const inActivityEndTime = moment(inActivityStartTime)
                    .add(activityTrackerForUserGroup.allowedTime, 'minutes')
                    .format();
                  let geoLocation = await GeoLocation.findOne({
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

                  const mapImage = await mapService().createAndSaveMap(
                    [
                      {
                        lat: geoCoords.lat,
                        lng: geoCoords.lng,
                      },
                    ],
                    'break_time_' + individualShiftTime.id,
                  );

                  const createdBreakTime = await BreakTime.create({
                    ...geoCoords,
                    shiftTimeId: individualShiftTime.id,
                    type: BREAK_TIME_TYPES.inactivity,
                    startTime: inActivityStartTime,
                    endTime: inActivityEndTime,
                    locationId: geoLocation && geoLocation.locationId,
                    location: get(geoLocation, 'locationMeta.address', 'Unknown Location'),
                    mapImage,
                  });
                  // TODO: Do we need to query the break again?
                  const [inActivityBreak, notifyUser] = await Promise.all([
                    BreakTime.findOne({
                      where: {
                        id: createdBreakTime.id,
                      },
                      include: [
                        {
                          model: Location,
                          as: 'locationMeta',
                          attributes: ['lat', 'lng', 'address'],
                        },
                      ],
                    }),
                    shiftService().notifyAdminAndManagersValidation(user, individualShiftTime.id, company.dbName),
                  ]);

                  if (notifyUser) {
                    const notifyFeed = await alertService().notifyShiftFeed(
                      {
                        userId: individualShiftTime.user.id,
                        objectId: inActivityBreak.id, // Break Time Reference
                        category: SHIFT_FEED_CATEGORIES.infraction,
                        type: SHIFT_FEED_TYPES.shift_inactivity,
                      },
                      company,
                      geoCoords,
                    );

                    const payloadForPushNotification = {
                      id: inActivityBreak.id,
                      userName: individualShiftTime.user.firstName + ' ' + individualShiftTime.user.lastName,
                      startTime: inActivityStartTime,
                      endTime: inActivityEndTime,
                      ...geoCoords,
                      location: get(geoLocation, 'locationMeta.address', 'Unknown Location'),
                      description: NOTIFICATION_DESCRIPTIONS.shift_inactivity,
                      colorCode: NOTIFICATION_COLOR.shift_inactivity,
                    };
                    // alert user for in-activity
                    const notificationForUser = {
                      userId: individualShiftTime.user.id,
                      type: NOTIFICATION_TYPES.shift_inactivity,
                      color: NOTIFICATION_COLOR.shift_inactivity,
                      text: NOTIFICATION_TEXTS.shift_inactivity,
                      notifyForUserId: individualShiftTime.user.id,
                    };
                    const payloadForUser = {
                      title: NOTIFICATION_TEXTS.shift_inactivity,
                      body: {
                        type: NOTIFICATION_TYPES.shift_inactivity,
                        category: NOTIFICATION_CATEGORIES.for_user,
                        message: NOTIFICATION_TEXTS.shift_inactivity,
                        details: payloadForPushNotification,
                      },
                    };

                    // alert managers for in-activity
                    const notificationForManagers = {
                      type: NOTIFICATION_TYPES.shift_inactivity,
                      color: NOTIFICATION_COLOR.shift_inactivity,
                      text: NOTIFICATION_TEXTS.shift_inactivity,
                      notifyForUserId: individualShiftTime.user.id,
                    };
                    const payloadForManagers = {
                      title: NOTIFICATION_TEXTS.shift_inactivity,
                      body: {
                        type: NOTIFICATION_TYPES.shift_inactivity,
                        category: NOTIFICATION_CATEGORIES.for_manager,
                        message: `${
                          individualShiftTime.user.firstName + ' ' + individualShiftTime.user.lastName
                        } ${NOTIFICATION_TEXTS.shift_inactivity}`,
                        details: {
                          ...payloadForPushNotification,
                          shiftFeedId: notifyFeed.id,
                        },
                      },
                    };

                    await Promise.all([
                      alertService().notifyUser(
                        individualShiftTime.user,
                        notificationForUser,
                        payloadForUser,
                        company,
                      ),
                      alertService().notifyManagers(
                        individualShiftTime.user,
                        notificationForManagers,
                        payloadForManagers,
                        company,
                      ),
                      shiftAdminService().autoSaveInfraction(notifyFeed, company),
                    ]);

                    cronShiftLogger.log({
                      operationName: 'doTrackRdnActivities',
                      message: 'User Inactivity',
                      userId: individualShiftTime.user.id,
                      duration: `from ${inActivityStartTime} to ${inActivityEndTime}`,
                      level: 'info',
                    });
                  }

                  if (moment().valueOf() > moment(individualShiftTime.shiftPeriodEndTime).valueOf()) {
                    await shiftService().endShiftWhenInactiveAfterShiftTime(
                      individualShiftTime,
                      moment().format(),
                      company,
                    );
                  }
                }
              }
            }
          }),
        );
      }),
    );
  } catch (error) {
    cronShiftLogger.log({
      operationName: 'doTrackRdnActivities',
      message: 'doTrackRdnActivities cron job error',
      error: {
        message: error.message,
        stack: error.stack,
      },
      level: 'error',
    });
  }
};

const doCloseOverShiftTimes = async (company) => {
  // Fetch all ongoing manual shifts and filter out the ones considered to be overtime (10 hours).
  const manualOvertimeShifts = await shiftService().getOverShiftTimesOnShiftManualTime(company.dbName);

  // Fetch all ongoing normal shifts and filter out the ones still in shift 15 minutes after the shift end time.
  const normalOvertimeShifts = await shiftService().getOverShiftTimesOnShift(company.dbName);

  // End the user's shifts that are in overtime if there are any.
  manualOvertimeShifts && (await closeManualShiftsInOvertime(company, manualOvertimeShifts));
  normalOvertimeShifts && (await closeNormalShiftsInOvertime(company, normalOvertimeShifts));
};

module.exports = {
  doCalcShiftCommissions,
  doTrackRdnActivities,
  doCloseOverShiftTimes,
  rdnActivitiesBetaTesters,
};
