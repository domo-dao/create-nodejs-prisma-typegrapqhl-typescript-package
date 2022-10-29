const { serverLogger } = require("../config/logger");
const {
  EMAIL_SUBJECT_NAMES,
  EMAIL_TEMPLATE_NAMES,
  SYSTEM_ADMIN_EMAIL_FOR_BIBLE_REQUEST,
  CONTACT_US_MAIL
} = require("../constants/app.constants");
const mailService = require("./mail.service");

const sendMailForBibleRequest = async bibleUser => {
  await Promise.all([
    sendMailToSystemAdminForBibleRequest(bibleUser),
    sendMailToBibleRequestedUser(bibleUser)
  ]);
};

const sendMailToSystemAdminForBibleRequest = async bibleUser => {
  SYSTEM_ADMIN_EMAIL_FOR_BIBLE_REQUEST.map(async systemAdminMailAddress => {
    try {
      const mailConfig = await mailService().config({
        to: systemAdminMailAddress,
        from: bibleUser.email,
        subject: EMAIL_SUBJECT_NAMES.bibleRequest,
        template: EMAIL_TEMPLATE_NAMES.bibleRequest,
        templateOptions: {
          bibleUser: bibleUser
        }
      });

      await mailService().send(mailConfig);
    } catch (e) {
      serverLogger.log({
        operationName: "sendMailError",
        message: `===> Error on admin ${systemAdminMailAddress} when ${EMAIL_SUBJECT_NAMES.bibleRequest}: ${e}`,
        error: e,
        level: "error"
      });
    }
  });
};

const sendMailToBibleRequestedUser = async bibleUser => {
  try {
    const mailConfig = await mailService().config({
      to: bibleUser.email,
      from: SYSTEM_ADMIN_EMAIL_FOR_BIBLE_REQUEST[0],
      subject: EMAIL_SUBJECT_NAMES.bibleConfirmationMail,
      template: EMAIL_TEMPLATE_NAMES.bibleConfirmationMail,
      templateOptions: {
        bibleUser: bibleUser,
        contactUsMail: CONTACT_US_MAIL
      }
    });

    await mailService().send(mailConfig);
  } catch (e) {
    serverLogger.log({
      operationName: "sendMailError",
      message: `===> Error on user ${bibleUser.email} ${EMAIL_SUBJECT_NAMES.bibleConfirmationMail}: ${e}`,
      error: e,
      level: "error"
    });
  }
};

module.exports = {
  sendMailForBibleRequest
};
