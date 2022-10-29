const Sequelize = require("sequelize");
const moment = require("moment");
const {
  REFERESH_TOKEN_INTERVAL_BEFORE_EXPIRE
} = require("../constants/app.constants");
const messageConstants = require("../constants/message.constants");
const tokenService = require("./token.service");
const httpStatus = require("http-status");

const sessionService = () => {
  const companyService = require("./company.service");
  const registerDeviceToken = async (
    userId,
    device,
    deviceToken,
    deviceId,
    dbName
  ) => {
    const { Session } = await companyService().getCompanyDatabase(dbName);
    const session = await Session.findOne({
      where: {
        userId,
        device
      }
    });

    if (session) {
      session.deviceId = deviceId;
      session.deviceToken = deviceToken || null;
      await session.save();
    }

    // remove same device token for another user
    await Session.update(
      {
        deviceToken: null
      },
      {
        where: {
          ...(userId && {
            userId: {
              [Sequelize.Op.ne]: userId
            }
          }),
          ...(device && {
            device
          }),
          ...(deviceToken && {
            deviceToken
          })
        }
      }
    );
  };

  const fetchOneSession = async (userId, device, dbName) => {
    const { Session } = await companyService().getCompanyDatabase(dbName);
    const session = await Session.findOne({
      where: {
        userId,
        device
      }
    });

    return session;
  };

  const regenerateSession = async (token, payload) => {
    let newToken;
    const dbName = payload.dbName;
    const { Session } = await companyService().getCompanyDatabase(dbName);
    if (
      Math.floor(Date.now() / 1000) >=
      payload.exp - REFERESH_TOKEN_INTERVAL_BEFORE_EXPIRE
    ) {
      const session = await Session.findOne({
        where: {
          token
        }
      });
      if (session) {
        const newSessionCreated = await Session.findOne({
          where: {
            userId: session.userId,
            device: session.device,
            deviceToken: session.deviceToken,
            deviceId: session.deviceId,
            loggedIn: {
              [Sequelize.Op.gte]: moment()
                .subtract(REFERESH_TOKEN_INTERVAL_BEFORE_EXPIRE, "hours")
                .format("YYYY-MM-DD HH:mm:ss")
            }
          }
        });
        if (!newSessionCreated) {
          newToken = tokenService().issueJWT(
            { id: payload.id, dbName: payload.dbName },
            true
          );
          const decodedToken = tokenService().verifyJWT(newToken);
          await Session.create({
            userId: session.userId,
            device: session.device,
            deviceToken: session.deviceToken,
            deviceId: session.deviceId,
            loggedIn: moment().format(),
            expiresIn: decodedToken.exp,
            token: newToken
          });
        }
      }
    }
    return { success: true, newToken };
  };

  const removeUnauthorizeSession = async (token, payload) => {
    if (payload === null) {
      return {
        success: false,
        status: httpStatus.UNAUTHORIZED,
        message: messageConstants.INVALID_TOKEN
      };
    }
    const dbName = payload.dbName;
    const { Session } = await companyService().getCompanyDatabase(dbName);
    if (Math.floor(Date.now() / 1000) > payload.exp) {
      await Session.destroy({
        where: {
          userId: payload.id,
          token
        }
      });
      return {
        success: false,
        status: httpStatus.UNAUTHORIZED,
        message: messageConstants.INVALID_TOKEN
      };
    } else {
      return { success: true };
    }
  };

  const registerSession = async (
    userId,
    device,
    deviceToken,
    deviceId,
    expiresIn,
    token,
    company
  ) => {
    const loggedIn = moment().format();
    const { Session } = await companyService().getCompanyDatabase(
      company.dbName
    );
    const session = await Session.findOne({
      where: {
        ...(userId && {
          userId
        }),
        ...(device && {
          device
        }),
        ...(deviceToken && {
          deviceToken
        })
      }
    });
    if (session) {
      session.loggedIn = loggedIn;
      session.expiresIn = expiresIn;
      session.token = token;
      await session.save();
    } else {
      await Session.create({
        userId,
        device,
        deviceToken,
        deviceId,
        loggedIn,
        expiresIn,
        token
      });
    }
  };

  const deleteSessions = async (filterData, company) => {
    const { Session } = await companyService().getCompanyDatabase(
      company.dbName
    );
    await Session.destroy({
      where: {
        ...filterData
      }
    });
  };

  const getVerifiedTokenSession = async token => {
    const decodedToken = tokenService().verifyJWT(token);

    const invalidTokenError = {
      success: false,
      message: messageConstants.TOKEN_EXPIRED
    };
    if (!decodedToken) {
      return invalidTokenError;
    }
    let dateNow = new Date();
    if (
      decodedToken &&
      decodedToken.exp < Math.round(dateNow.getTime() / 1000)
    ) {
      return invalidTokenError;
    }
    if (!decodedToken.dbName) {
      return;
    }
    const dbName = decodedToken.dbName;
    const { Session, User } = await companyService().getCompanyDatabase(dbName);
    const session = await Session.findOne({
      where: {
        token
      },
      include: [{ model: User, as: "user" }],
      raw: true,
      nest: true
    });

    if (!session) {
      const err = {
        success: false,
        message: messageConstants.TOKEN_DOES_NOT_EXIST
      };
      return err;
    }
    return session;
  };

  return {
    registerDeviceToken,
    fetchOneSession,
    registerSession,
    deleteSessions,
    getVerifiedTokenSession,
    regenerateSession,
    removeUnauthorizeSession
  };
};

module.exports = sessionService;
