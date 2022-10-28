require('dotenv').config();
const {
  SHIFT_FEED_CATEGORIES,
  SHIFT_FEED_TYPES,
  EMAIL_MAPS,
  EXPIRY_TIME_ALERTS_FEED,
} = require('../../server/constants/app.constants');
const companyService = require('../../server/services/company.service');
const alertService = require('../../server/services/alert.service');

const config = {
  emailRecipient: 'elkareem123@gmail.com',
  typeInfraction: SHIFT_FEED_TYPES.shift_inactivity,
  company: {
    dbName: 'rra_db',
  },
};

async function testCreateInfraction(config) {
  const { User, ShiftFeed } = await companyService().getCompanyDatabase(config.company.dbName);
  const user = await User.findOne({
    where: { email: config.emailRecipient },
  }).catch((err) => console.log(err));

  if (!user) {
    console.log('User not found');
    return;
  }

  const individualShiftTime_user = {
    id: user.dataValues.id,
    rdnId: user.dataValues.rdnId,
    roleId: user.dataValues.roleId,
    branchId: user.dataValues.branchId,
    firstName: user.dataValues.firstName,
    lastName: user.dataValues.lastName,
    phoneNumber: user.dataValues.phoneNumber,
    email: user.dataValues.email,
    avatarUrl: null,
    branch: {
      id: 1,
      name: 'Main',
      displayRank: 0,
      createdAt: null,
      updatedAt: null,
    },
  };

  const notificationForUser = {
    userId: user.dataValues.id,
    type: config.typeInfraction,
    color: '#F24949',
    text: 'infraction text',
    notifyForUserId: user.dataValues.id,
  };

  const payloadForUser = {
    title: 'Title test',
    body: {
      type: SHIFT_FEED_TYPES.shift_inactivity,
      category: 'for_user',
      message: 'Test message',
      details: {
        id: 370882,
        userName: `${user.dataValues.firstName} ${user.dataValues.lastName}`,
        startTime: '2022-08-12T03:28:38+00:00',
        endTime: '2022-08-12T03:33:38+00:00',
        lat: 37.421998333333335,
        lng: -122.084,
        location: '1600 Amphitheatre Pkwy, Mountain View, CA 94043, USA',
        description: 'Generic description of infraction.',
        colorCode: '#F24949',
      },
    },
  };

  // Create notification for user
  await alertService()
    .notifyUser(individualShiftTime_user, notificationForUser, payloadForUser, config.company)
    .catch((err) => console.log('error in notifyUser', err));

  // Create notification in feed
  const newShiftFeedRecord = {
    userId: user.id,
    objectId: 370929,
    category: SHIFT_FEED_CATEGORIES.infraction,
    type: config.typeInfraction,
    mapImage: EMAIL_MAPS.default_image,
  };

  // Arange the data for the shift_feed record
  const currentDateTime = new Date();
  currentDateTime.setHours(currentDateTime.getHours() + EXPIRY_TIME_ALERTS_FEED);
  newShiftFeedRecord.expiryDate = currentDateTime;

  await ShiftFeed.create(newShiftFeedRecord).catch((err) => {
    console.log('error in feed', err);
  });
}

testCreateInfraction(config).then(() => {
  console.log('done');
});
