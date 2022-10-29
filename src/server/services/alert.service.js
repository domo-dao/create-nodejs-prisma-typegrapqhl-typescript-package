const Sequelize = require('sequelize');
const { map, compact } = require('lodash');
const { messaging } = require('../utils/firebaseInit');
const smsService = require('./sms.service');
const snsService = require('./sns.service');
const mapService = require('./map.service');
const notificationService = require('./notification.service');
const {
  EXPIRY_TIME_ALERTS_FEED,
  NOTIFICATION_CATEGORIES,
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  MANAGER_ROLE,
  DRIVER_ROLE,
  ALERT_METHODS,
  DEVICE_TYPES,
  USER_STATUS,
  SHIFT_FEED_CATEGORIES,
  PUSH_NOTIFICATION_TTL,
  EMAIL_MAPS,
} = require('../constants/app.constants');
const { emailReplyAddress, awsSnsInfractionsTopicARN } = require('../config/vars');
const io = require('../sockets/io');
const { BACKEND_NEW_NOTIFICATION } = require('../sockets/events');
const userService = require('./user.service');

const alertService = () => {
  const companyService = require('./company.service');
  const notifyUser = async (user, notification, payload, company) => {
    const { Notification, Session, Alert } = await companyService().getCompanyDatabase(company.dbName);
    let userTokens = await Session.findAll({
      attributes: ['deviceToken', 'device'],
      where: {
        userId: user && user.id,
        deviceToken: {
          [Sequelize.Op.ne]: null,
        },
      },
      raw: true,
    });

    // store user notification
    if (notification) {
      const newNotification = await Notification.create({
        ...notification,
        category: NOTIFICATION_CATEGORIES.for_user,
      });

      const totalUnread = await notificationService().getNotificationsUnReadTotalCount(company.dbName, {
        userId: newNotification.userId,
      });

      const data = {
        title: payload.title || 'Insightt Push Notification',
        body: payload.body ? JSON.stringify(payload.body) : '',
        totalUnread,
      };

      await snsService().publishToTopic(awsSnsInfractionsTopicARN, {
        userId: newNotification.userId,
        ...data,
      });
    }

    if (userTokens.length) {
      const tokens = map(userTokens, (userToken) => userToken.deviceToken);
      await messaging.sendMulticast({
        tokens,
        data: {
          title: payload.title || 'Insightt Push Notification',
          body: payload.body ? JSON.stringify(payload.body) : '',
        },
        notification: {
          title: payload.title || 'Insightt Push Notification',
          body: payload.body ? payload.body.message || '' : '',
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

    // send sms if SMS alert is enabled and user has phone
    const smsAlert = await Alert.findOne({
      where: {
        userId: user.id,
        method: ALERT_METHODS.sms,
      },
    });
    if (smsAlert && smsAlert.enabled && user.phoneNumber && notification) {
      await smsService().sendMsg({
        message: notification.text || '',
        phoneNumber: user.phoneNumber,
      });
    }

    // send email if Email alert is enabled
    const emailAlert = await Alert.findOne({
      where: {
        userId: user.id,
        method: ALERT_METHODS.email,
      },
    });
    if (emailAlert && emailAlert.enabled && user.email) {
      const config = {
        to: user.email,
        subject: payload.title || 'Insightt Notification',
        planText: payload.body ? payload.body.message || '' : '',
        emailReplyAddress: emailReplyAddress || company.emailReplyAddress,
      };
      await userService().reSendMailToUserService(config);
    }
  };

  const notifyManagers = async (user, notification, payload, company) => {
    const { Role, User, Notification, Session, Alert, Branch } = await companyService().getCompanyDatabase(
      company.dbName,
    );
    const userRole = await Role.findOne({
      where: {
        id: user.roleId,
      },
    });

    if (userRole.role === SUPER_ADMIN_ROLE) {
      return;
    }

    const [superAdminRole, supervisorRoles] = await Promise.all([
      Role.findOne({
        where: {
          role: SUPER_ADMIN_ROLE,
        },
      }),
      userRole.role === DRIVER_ROLE
        ? Role.findAll({
            where: {
              role: {
                [Sequelize.Op.in]: [ADMIN_ROLE, MANAGER_ROLE],
              },
            },
          })
        : [],
    ]);

    const managers = await User.findAll({
      where: {
        [Sequelize.Op.or]: [
          {
            roleId: superAdminRole.id,
          },
          {
            ...(userRole.role === DRIVER_ROLE && {
              branchId: user.branchId,
              roleId: {
                [Sequelize.Op.in]: supervisorRoles.map((role) => role.id),
              },
              status: USER_STATUS.active,
            }),
          },
        ],
      },
    });

    let adminRole = supervisorRoles.find(({ role }) => role === ADMIN_ROLE);
    await Promise.all(
      map(managers, async (manager) => {
        // store manager notification
        const newNotification = await Notification.create({
          userId: manager.id,
          ...notification,
          category: NOTIFICATION_CATEGORIES.for_manager,
        });

        if (newNotification) {
          const totalUnread = await notificationService().getNotificationsUnReadTotalCount(company.dbName, {
            userId: newNotification.userId,
          });

          const data = {
            title: payload.title || 'Insightt Push Notification',
            body: payload.body ? JSON.stringify(payload.body) : '',
            totalUnread,
          };

          io.to([newNotification.userId]).emit(BACKEND_NEW_NOTIFICATION, data);

          await snsService().publishToTopic(awsSnsInfractionsTopicARN, {
            userId: newNotification.userId,
            ...data,
          });
        }

        // send push notifications to manager
        let managerTokens = await Session.findAll({
          attributes: ['deviceToken', 'device'],
          where: {
            userId: manager.id,
            deviceToken: {
              [Sequelize.Op.ne]: null,
            },
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'roleId'],
            },
          ],
          raw: true,
        });
        if (managerTokens.length) {
          const tokens = compact(
            map(managerTokens, (managerToken) => {
              if (
                adminRole &&
                managerToken['user.roleId'] === adminRole.id &&
                managerToken.device === DEVICE_TYPES.mobile
              ) {
                return;
              }
              return managerToken.deviceToken;
            }),
          );

          if (user) {
            const userBranchName = await Branch.findOne({
              where: {
                id: user.branchId,
              },
              raw: true,
            });
            user.branchName = userBranchName.name;
            delete user.deviceToken;
            delete user.password;
            if (!payload.body.details) {
              payload.body.details = {};
            }
            // delete user.company.dbName; <-- Faulty
            payload.body.details.user = user;
            payload.body.user = user;
          }

          tokens &&
            tokens.length &&
            (await messaging.sendMulticast({
              tokens,
              data: {
                title: payload.title || 'Insightt Push Notification',
                body: payload.body ? JSON.stringify(payload.body) : '',
              },
              notification: {
                title: payload.title || 'Insightt Push Notification',
                body: payload.body ? payload.body.message || '' : '',
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
            }));
        }

        // send sms if SMS alert is enabled and user has phone
        const smsAlert = await Alert.findOne({
          where: {
            userId: manager.id,
            method: ALERT_METHODS.sms,
          },
        });
        if (smsAlert && smsAlert.enabled && manager.phoneNumber) {
          await smsService().sendMsg({
            message: notification.text || '',
            phoneNumber: manager.phoneNumber,
          });
        }

        // send email if Email alert is enabled
        const emailAlert = await Alert.findOne({
          where: {
            userId: manager.id,
            method: ALERT_METHODS.email,
          },
        });
        if (emailAlert && emailAlert.enabled && manager.email) {
          const config = {
            to: manager.email,
            subject: payload.title || 'Insightt Notification',
            planText: payload.body ? payload.body.message || '' : '',
            emailReplyAddress: emailReplyAddress || company.emailReplyAddress,
          };
          await userService().reSendMailToUserService(config);
        }
      }),
    );
  };

  const notifyShiftFeed = async (feed, company, location) => {
    const { ShiftFeed } = await companyService().getCompanyDatabase(company.dbName);
    if (feed.category === SHIFT_FEED_CATEGORIES.alert || feed.category === SHIFT_FEED_CATEGORIES.commission) {
      const currentDateTime = new Date();
      currentDateTime.setHours(currentDateTime.getHours() + EXPIRY_TIME_ALERTS_FEED);
      feed.expiryDate = currentDateTime;
    }

    if (location) {
      const mapImage = await mapService().createAndSaveMap(
        [
          {
            lat: location.lat,
            lng: location.lng,
          },
        ],
        'shift_feed_' + feed.objectId,
      );

      feed.mapImage = mapImage;
    } else {
      feed.mapImage = EMAIL_MAPS.default_image;
    }

    const shiftFeed = await ShiftFeed.create(feed);
    return shiftFeed;
  };

  const pingDashboard = async (company, event = '') => {
    const { Session } = await companyService().getCompanyDatabase(company.dbName);

    let tokens = await Session.findAll({
      where: {
        deviceToken: {
          [Sequelize.Op.ne]: null,
        },
        device: DEVICE_TYPES.web,
      },
      raw: true,
    });

    tokens = tokens.map((token) => token.deviceToken);

    if (!tokens.length) return;

    await messaging.sendMulticast({
      tokens,
      content_available: true,
      data: {
        event,
      },
    });
  };

  return {
    notifyUser,
    notifyManagers,
    notifyShiftFeed,
    pingDashboard,
  };
};

module.exports = alertService;
