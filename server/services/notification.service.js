const Sequelize = require("sequelize");
const { NOTIFICATION_STATUSES } = require("../constants/app.constants");
const io = require("../sockets/io");
const { BACKEND_NEW_NOTIFICATION } = require("../sockets/events");

const notificationService = () => {
  const companyService = require("./company.service");
  const getNotificationsUnReadTotalCount = async (dbName, filterData) => {
    const { Notification } = await companyService().getCompanyDatabase(dbName);
    const totalUnreadCount = await Notification.findAll({
      attributes: [[Sequelize.fn("count", Sequelize.col("id")), "count"]],
      where: {
        ...(filterData && {
          ...filterData
        }),
        status: {
          [Sequelize.Op.in]: [NOTIFICATION_STATUSES.created]
        }
      },
      raw: true
    });
    return totalUnreadCount[0].count || 0;
  };

  const getNewNotification = async (data, isSocketEmit = true) => {
    const { dbName, notification } = data;
    const { Notification, User } = await companyService().getCompanyDatabase(
      dbName
    );
    const totalUnread = await getNotificationsUnReadTotalCount(dbName, {
      userId: notification.userId
    });
    const newNotification = await Notification.findOne({
      where: {
        id: notification.id
      },
      include: [
        {
          model: User,
          as: "notifyForUser"
        }
      ],
      raw: true,
      nest: true
    });

    const newNotificationResponse = {
      data: {
        newNotification,
        totalUnread
      }
    };

    if (isSocketEmit) {
      io.to([notification.userId]).emit(
        BACKEND_NEW_NOTIFICATION,
        newNotificationResponse
      );
    }

    return newNotificationResponse;
  };

  const getNotifications = async data => {
    const { user, filterData } = data;
    const company = user.company;
    const { Notification, User } = await companyService().getCompanyDatabase(
      company.dbName
    );

    const totalUnread = await getNotificationsUnReadTotalCount(company.dbName, {
      userId: user.id
    });

    const [totalCount, notifications] = await Promise.all([
      Notification.findAll({
        attributes: [[Sequelize.fn("count", Sequelize.col("id")), "count"]],
        where: {
          userId: user.id
        },
        raw: true
      }),
      Notification.findAll({
        where: {
          userId: user.id
        },
        include: [
          {
            model: User,
            as: "notifyForUser"
          }
        ],
        limit: Number(filterData.pageSize),
        offset:
          (Number(filterData.currentPage) - 1) * Number(filterData.pageSize),
        order: [["createdAt", "DESC"]]
      })
    ]);

    const totalItem = totalCount[0].count || 0;
    const totalPage =
      totalItem % filterData.pageSize === 0
        ? totalItem / filterData.pageSize
        : Math.floor(totalItem / filterData.pageSize) + 1;
    return {
      totalUnread,
      totalItem,
      pageSize: Number(filterData.pageSize),
      currentPage: Number(filterData.currentPage),
      totalPage,
      notifications
    };
  };

  return {
    getNotifications,
    getNewNotification,
    getNotificationsUnReadTotalCount
  };
};

module.exports = notificationService;
