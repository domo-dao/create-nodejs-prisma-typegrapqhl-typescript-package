const { SHIFT_FEED_CATEGORIES } = require("../constants/app.constants");
const alertService = require("./alert.service");

const commissionService = () => {
  const notifyNewCommission = async ({
    user,
    commission,
    company,
    text,
    shiftFeedType,
    notificationType,
    notificationColor
  }) => {
    const notifyFeed = await alertService().notifyShiftFeed(
      {
        userId: user.id,
        objectId: commission.id,
        category: SHIFT_FEED_CATEGORIES.commission,
        type: shiftFeedType
      },
      company
    );
    const notification = {
      type: notificationType,
      color: notificationColor,
      text: text,
      notifyForUserId: user.id
    };
    const payload = {
      title: "New Commission",
      body: {
        type: notificationType,
        message: `${user.firstName} ${user.lastName} ${notification.text}`,
        details: {
          userName: user.firstName + " " + user.lastName,
          amount: commission.amount,
          note: commission.note,
          colorCode: notificationColor,
          shiftFeedId: notifyFeed.id
        }
      }
    };
    await alertService().notifyManagers(user, notification, payload, company);
  };

  return { notifyNewCommission };
};

module.exports = commissionService;
