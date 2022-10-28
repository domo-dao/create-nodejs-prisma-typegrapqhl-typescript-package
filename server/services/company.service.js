const httpStatus = require('http-status');
const moment = require('moment');
const Sequelize = require('sequelize');
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const exec = require('child_process').exec;
const {
  PlatformCompany,
  RegistrationRequestedCompany,
  PlatformUser,
  PlatformRole,
} = require('../database/models');
const db = require('../database/models');
const endpoints = require('../rdn/endpoints');
const { SHIFT_STATUSES, END_SHIFT_TYPES, DEVICE_TYPES } = require('../constants/app.constants');
const messageConstants = require('../constants/message.constants');
const systemService = require('../services/system.service');
const userService = require('../services/user.service');
const mailService = require('../services/mail.service');
const bcryptService = require('../services/bcrypt.service');
const sessionService = require('./session.service');
const platformService = require('./platform.service');
const {
  AWS_CHECKLIST_BUCKET_NAME,
  AWS_PROFILE_PICS_BUCKET_NAME,
  AWS_EMPLOYMENT_FILES_BUCKET_NAME,
  AWS_MAP_REPORTS_BUCKET,
  INSIGHTT,
  SYSTEM_ADMIN_ROLE,
  COMPANY_USER_STATUS,
  EMAIL_TEMPLATE_NAMES,
  EMAIL_SUBJECT_NAMES,
  DATABASE_TYPES,
  USER_STATUS,
} = require('../constants/app.constants');
const { PLATFORM_SETTINGS } = require('../constants/platform.constants');
const Utils = require('../utils/util');
const APIError = require('../utils/APIError');
const { dbHost, dbPort, emailReplyAddress } = require('../config/vars');
const { PrismaClient } = require('@prisma/client');
const { serverLogger } = require('../config/logger');
const tokenService = require('./token.service');

const companyService = () => {
  const addOrEditCompanyDetails = async (dbName, requestData, isEditDetails = true) => {
    const { User } = await getCompanyDatabase(dbName);
    const [company, user] = await Promise.all([
      PlatformCompany.findOne({
        where: {
          dbName,
        },
      }),
      User.findOne({
        where: {
          email: requestData.email,
        },
      }),
    ]);

    if (!company) {
      const err = {
        status: httpStatus.UNAUTHORIZED,
        message: messageConstants.COMPANY_DOES_NOT_EXIST,
      };
      return err;
    }

    const userError = {
      status: httpStatus.UNPROCESSABLE_ENTITY,
      message: messageConstants.USER_DOES_NOT_EXIST,
    };

    if (!user) {
      return userError;
    }

    const platformUser = await userService().getPlatformUserDetails({
      email: user.email,
      companyId: company.id,
    });

    if (!platformUser) {
      return userError;
    }

    company['name'] = requestData['name'] || company['name'];
    company['emailReplyAddress'] = requestData['emailReplyAddress'] || company['emailReplyAddress'];
    company['password'] = requestData.password
      ? bcryptService().password(requestData.password)
      : company['password'];
    company['uniqueName'] = requestData['uniqueName'] || company['uniqueName'];
    if (requestData['uniqueName']) {
      company['uniqueName'] = `${INSIGHTT}-${company['uniqueName'].replace(/_/g, '-')}`;
    }
    if (company.dbName !== process.env.DEFAULT_DB) {
      company['awsChecklistBucketName'] = `${
        company['uniqueName'] || company['awsChecklistBucketName']
      }/${AWS_CHECKLIST_BUCKET_NAME}`;
      company['awsProfilePicsBucketName'] = `${
        company['uniqueName'] || company['awsProfilePicsBucketName']
      }/${AWS_PROFILE_PICS_BUCKET_NAME}`;
      company['awsEmployementFilesBucketName'] = `${
        company['uniqueName'] || company['awsEmployementFilesBucketName']
      }/${AWS_EMPLOYMENT_FILES_BUCKET_NAME}`;
      company['awsMapReportsBucketName'] = `${
        requestData['uniqueName'] || company['awsMapReportsBucketName']
      }/${AWS_MAP_REPORTS_BUCKET}`;
    }
    company['rdnId'] = requestData['rdnId'] || company['rdnId'];
    company['rdnKey'] = requestData['rdnKey'] || company['rdnKey'];
    company['drnKey'] = requestData['drnKey'] || company['drnKey'];
    company['syncRdnFrom'] = requestData['syncRdnFrom'] || company['syncRdnFrom'];
    user['password'] = requestData.password ? bcryptService().password(requestData.password) : user['password'];
    user['firstName'] = company['name'];
    user['isPasswordChangeRequired'] = false;
    platformUser['password'] = user['password'];
    platformUser['firstName'] = user['firstName'];
    let serverTime = {};
    if (requestData['serverLabel']) {
      serverTime = {
        label: requestData['serverLabel'],
        timezone: requestData['serverTimezone'],
        timezoneOffset: requestData['serverTimezoneOffset'],
      };
      await systemService().setServerTime(company.dbName, serverTime);
    }

    if (!user.branchId || user.branchId === 0) {
      const { Branch } = await getCompanyDatabase(company.dbName);
      const branch = await Branch.findOne({
        order: [['id', 'ASC']],
      });
      if (branch) {
        user.branchId = branch.id;
      }
    }

    if (!isEditDetails) {
      await createBucketAndFolder(company['uniqueName'], [
        AWS_CHECKLIST_BUCKET_NAME,
        AWS_PROFILE_PICS_BUCKET_NAME,
        AWS_EMPLOYMENT_FILES_BUCKET_NAME,
      ]);
    }

    await Promise.all([user.save(), platformUser.save(), company.save()]);
    return { success: true };
  };

  const createBucketAndFolder = async (bucket, folders, isCreateBucket = true, isCreateFolder = true) => {
    let response;
    if (isCreateBucket) {
      response = await Utils.createBucket(bucket);
    }
    if (((isCreateBucket && response && response.Location) || !isCreateBucket) && isCreateFolder) {
      await Promise.all(
        folders.map(async (folder) => {
          await Utils.createFolder(bucket, folder);
        }),
      );
    }
  };

  const getAndSubBranchList = async (company) => {
    const { Branch, SubBranch } = await getCompanyDatabase(company.dbName);
    const [branches, subBranches] = await Promise.all([
      Branch.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        raw: true,
      }),
      SubBranch.findAll({
        attributes: { exclude: ['createdAt', 'updatedAt'] },
        raw: true,
      }),
    ]);
    const branchesAndSubBranches = [];
    branches.map((branch) => {
      const matchedSubBranches = subBranches.filter((subBranch) => {
        return subBranch.branchId === branch.id;
      });
      branchesAndSubBranches.push({
        ...branch,
        subBranches: matchedSubBranches,
      });
    });
    return branchesAndSubBranches;
  };

  const getRdnAndDbUsersList = async (company) => {
    const { User } = await getCompanyDatabase(company.dbName);
    const rdnUsersList = await endpoints.getUsersList(company);
    const users = [];
    await Promise.all(
      rdnUsersList.map(async (user) => {
        const addedUsers = await User.findOne({
          where: {
            [Sequelize.Op.or]: [
              {
                rdnId: user['id']['_text'] || null,
              },
              {
                email: user['email_address']['_text'] || null,
              },
            ],
          },
        });
        if (addedUsers) {
          users.push(addedUsers);
        } else {
          if (user['active']['_text'] === 'true') {
            users.push({
              rdnUserId: user['user_id']?.['_text'] || null,
              rdnId: user['id']?.['_text'] || null,
              firstName: user['first_name']?.['_text'] || null,
              lastName: user['last_name']?.['_text'] || null,
              status: user['active']?.['_text'] || null,
              email: user['email_address']?.['_text'] || null,
              userType: user['user_type']?.['_text'] || null,
            });
          }
        }
      }),
    );
    return users;
  };

  const getUsersList = async (company) => {
    const { User } = await getCompanyDatabase(company.dbName);
    const users = await User.findAll({
      raw: true,
    });
    return users;
  };

  const getSpecificUser = async (company, reqData) => {
    const { User, Branch, Role } = await getCompanyDatabase(company.dbName);
    const user = await User.findOne({
      where: {
        email: reqData.email.toLowerCase(),
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'type', 'role'],
        },
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'name'],
        },
      ],
    });
    const err = {
      status: httpStatus.UNAUTHORIZED,
      message: '',
    };

    if (user === null) throw new APIError({ ...err, message: messageConstants.USER_DOES_NOT_EXIST });
    if (user.status !== USER_STATUS.active)
      throw new APIError({ ...err, message: messageConstants.INACTIVE_ACCOUNT });
    if (!bcryptService().comparePassword(reqData.password, user.password)) {
      throw new APIError({ ...err, message: messageConstants.WRONG_PASSWORD });
    }

    return user;
  };

  const checkUserSession = async (company, user, reqData, dbName) => {
    let isShiftEnded = false;
    const { ShiftTime } = await companyService().getCompanyDatabase(company.dbName);

    const loggedInSession = await sessionService().fetchOneSession(user.id, reqData.deviceType, dbName);

    const enableSessionManagement = await platformService().getPlatformSetting(
      PLATFORM_SETTINGS.enableSessionManagement,
    );

    if (loggedInSession) {
      if (
        loggedInSession.deviceToken &&
        reqData.deviceToken &&
        loggedInSession.deviceToken !== reqData.deviceToken &&
        reqData.deviceType === DEVICE_TYPES.mobile &&
        loggedInSession.device === DEVICE_TYPES.mobile &&
        enableSessionManagement === '1'
      ) {
        const err = {
          status: httpStatus.UNPROCESSABLE_ENTITY,
          message: messageConstants.ALREADY_LOGGED_IN,
          isAlreadyLogin: true,
        };
        // return res.status(err.status).json(err);
        throw new APIError({ ...err });
      }
      if (loggedInSession.deviceToken !== reqData.deviceToken) {
        let [shiftTime] = await Promise.all([
          ShiftTime.findOne({
            where: {
              user_id: user.id,
              status: {
                [Sequelize.Op.ne]: SHIFT_STATUSES.ended,
              },
            },
          }),
          sessionService().registerDeviceToken(
            user.id,
            reqData.deviceType,
            reqData.deviceToken,
            reqData.deviceId,
            dbName,
          ),
        ]);

        if (shiftTime) {
          shiftTime.endTime = moment().format();
          shiftTime.status = SHIFT_STATUSES.ended;
          shiftTime.endShiftType = END_SHIFT_TYPES.duplicate_login;
          isShiftEnded = true;
          await shiftTime.save();
        }
      }
    }
    return isShiftEnded;
  };

  const setUserSession = async (company, user, reqData, dbName) => {
    const payload = { id: user.id, dbName };
    const jwtToken = tokenService().issueJWT(payload, true);
    const decodedToken = tokenService().verifyJWT(jwtToken);
    if (decodedToken && decodedToken.exp) {
      await sessionService().registerSession(
        user.id,
        reqData.deviceType,
        reqData.deviceToken,
        reqData.deviceId,
        decodedToken.exp, // NumericDate of token exp
        jwtToken,
        company,
      );
    } else {
      throw new APIError({ status: httpStatus.UNAUTHORIZED, message: messageConstants.INVALID_TOKEN });
    }

    return jwtToken;
  };

  const changeRequestRegistrationStatus = async (id, status) => {
    const registrationRequestCompany = await RegistrationRequestedCompany.findOne({
      where: {
        id,
      },
    });
    if (!registrationRequestCompany) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.COMPANY_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }
    registrationRequestCompany.status = status;
    await registrationRequestCompany.save();
  };

  const syncCompanyDB = async (dbName = null, migrationOperationType = 'db:migrate') => {
    const dynamicConfigFolderPath = `${global.__baseDir}/server/database/dynamic_config`;
    const dynamicConfigFilePath = `${dynamicConfigFolderPath}/index.js`;
    const platformCompanies = await PlatformCompany.findAll({
      ...(dbName && {
        where: {
          dbName,
        },
      }),
      raw: true,
    });
    let dynamicDBConfigString = ``;
    const exportedDB = [];
    platformCompanies.map((platformCompany) => {
      if (!exportedDB.includes(platformCompany.dbName)) {
        dynamicDBConfigString += `
          const ${platformCompany.dbName} = {
            username: '${platformCompany.dbUsername}',
            password: '${platformCompany.dbUserPassword}',
            database: '${platformCompany.dbName}',
            host: '${process.env.DB_HOST}',
            port: '${process.env.DB_PORT}',
            dialect: 'mysql',
            logging: (...msg)=>{console.log(msg)},
          };
  
        `;
        exportedDB.push(platformCompany.dbName);
      }
    });

    dynamicDBConfigString += `
      module.exports = {
        ${exportedDB.join(',')}
      };
    `;
    const dynamic_db_dir = path.join(global.__baseDir, 'server', 'database', 'dynamic_config');
    if (!fs.existsSync(dynamic_db_dir)) {
      fs.mkdirSync(dynamic_db_dir, { recursive: true });
    }
    fs.writeFileSync(dynamicConfigFilePath, dynamicDBConfigString);
    if (dbName) {
      console.log('dbName', dbName, migrationOperationType);
      execSync(
        `sequelize-cli --options-path ./.sequelize-dynamic-company-db --env ${dbName} ${migrationOperationType}`,
      );
    } else {
      const promises = platformCompanies.map((platformCompany) => {
        return new Promise((resolve) => {
          console.log('MIGRATE: Initializing migration for: ', platformCompany.dbName);
          const command = `sequelize-cli --options-path ./.sequelize-dynamic-company-db --env ${platformCompany.dbName} ${migrationOperationType}`;
          exec(command, { timeout: 1000 * 60 * 5 }, (error) => {
            if (error !== null) {
              console.log('MIGRATE: Error on migration for: ', platformCompany.dbName, String(error));
              return resolve(false);
            }
            console.log('MIGRATE: Successfully migrated: ', platformCompany.dbName);
            return resolve(true);
          });
        });
      });
      const results = await Promise.all(promises);
      if (results.includes(false)) {
        fs.unlinkSync(dynamicConfigFilePath);
        fs.rmSync(dynamicConfigFolderPath, { recursive: true });
        throw new Error('MIGRATION command failed');
      }
    }
    fs.unlinkSync(dynamicConfigFilePath);
    fs.rmSync(dynamicConfigFolderPath, { recursive: true });
  };

  const registerUnknownCompany = async (reqData) => {
    const isUserFoundWithRequestedEmail = await PlatformUser.findOne({
      where: {
        email: reqData.email,
      },
    });

    if (!isUserFoundWithRequestedEmail) {
      await RegistrationRequestedCompany.create({
        ...reqData,
        status: COMPANY_USER_STATUS.pending,
      });
    }

    const systemAdminRole = await PlatformRole.findOne({
      where: {
        role: SYSTEM_ADMIN_ROLE,
      },
    });

    if (!systemAdminRole) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.SYSTEM_ADMIN_ROLE_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }

    const systemAdmin = await PlatformCompany.findOne({
      where: {
        roleId: systemAdminRole.id,
      },
    });

    if (!systemAdmin) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.NO_USER_WITH_ROLE_SYSTEM_ADMIN_EXIST,
      };
      throw new APIError(err);
    }

    await sendMailToSystemAdmin(
      systemAdmin.email === 'admin@rra.com' ? 'bhamilton@rapidrecoveryagency.com' : systemAdmin.email,
      reqData,
    );
    await sendMailToUnknownUser(reqData);
  };

  const sendMailToSystemAdmin = async (email, joinWaitingCompanyDetails) => {
    try {
      const systemAdminMailConfig = await mailService().config({
        to: email,
        subject: EMAIL_SUBJECT_NAMES.unknownCompanyRegistrationRequest,
        template: EMAIL_TEMPLATE_NAMES.unknownCompanyRegistrationRequest,
        templateOptions: {
          joinWaitingCompanyDetails,
        },
      });
      await mailService().send(systemAdminMailConfig);
    } catch (e) {
      serverLogger.log({
        operationName: 'sendMailError',
        message: `===> Error on admin ${email} when ${EMAIL_SUBJECT_NAMES.unknownCompanyRegistrationRequest}: ${e}`,
        error: e,
        level: 'error',
      });
    }
  };

  const sendMailToUnknownUser = async (joinWaitingCompanyDetails) => {
    try {
      const requestedUserMailConfig = await mailService().config({
        to: joinWaitingCompanyDetails.email,
        subject: EMAIL_SUBJECT_NAMES.unknownCompanyRegistrationAcknowledge,
        template: EMAIL_TEMPLATE_NAMES.unknownCompanyRegistrationAcknowledge,
        templateOptions: {
          joinWaitingCompanyDetails,
        },
      });
      await mailService().send(requestedUserMailConfig);
    } catch (e) {
      serverLogger.log({
        operationName: 'sendMailError',
        message: `===> Error on user ${joinWaitingCompanyDetails.email} ${EMAIL_SUBJECT_NAMES.unknownCompanyRegistrationAcknowledge}: ${e}`,
        error: e,
        level: 'error',
      });
    }
  };

  const getCompanyDatabase = async (dbName) => {
    const companyDatabase = db[dbName];
    if (companyDatabase !== undefined) return companyDatabase;

    const company = await PlatformCompany.findOne({
      where: {
        dbName,
      },
    });
    const pool = {
      max: 400,
      min: 0,
      idle: 1000,
      acquire: 60000,
    };
    const companySequelize = new Sequelize({
      database: company.dbName,
      username: company.dbUsername,
      password: company.dbUserPassword,
      host: dbHost,
      port: dbPort,
      dialect: 'mysql',
      pool,
      define: {
        charset: 'utf8',
        collate: 'utf8_general_ci',
      },
      logging: false,
      // benchmark: true,
    });
    companySequelize.authenticate();
    db[company.dbName] = {};

    // console.log("Company:", company);

    // const modelDirectory = path.resolve("server", "database", "models");
    const modelDirectory = path.join(__dirname, '..', 'database', 'models');
    const basename = path.basename(path.resolve('server', 'database', 'models', 'index.js'));

    fs.readdirSync(`${modelDirectory}/${[DATABASE_TYPES.company_db]}`)
      .filter((file) => {
        return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
      })
      .forEach((file) => {
        const model = require(path.join(`${modelDirectory}/${[DATABASE_TYPES.company_db]}`, file))(
          companySequelize,
          Sequelize.DataTypes,
        );
        db[company.dbName][model.name] = model;
      });
    Object.keys(db[company.dbName]).forEach((modelName) => {
      if (db[company.dbName][modelName].associate) {
        db[company.dbName][modelName].associate(db[company.dbName]);
      }
    });
    await Utils.getBranchAndSubBranches(company.dbName);
    const url = `mysql://${company.dbUsername}:${company.dbUserPassword}@${dbHost}:${dbPort}/${company.dbName}`;
    const companyPrisma = new PrismaClient({
      datasources: {
        db: {
          url: url,
        },
      },
    });
    db[`${company.dbName}_sequelize`] = companySequelize;
    db[`${company.dbName}_prisma`] = companyPrisma;
    return db[company.dbName];
  };

  const getCompanyConnection = async (dbName) => {
    const companyDatabase = db[dbName];
    if (companyDatabase !== undefined) {
      return {
        sequelize: db[`${dbName}_sequelize`],
        prisma: db[`${dbName}_prisma`],
      };
    }
    await getCompanyDatabase(dbName);
    return getCompanyConnection(dbName);
  };

  const getAllApprovedCompanies = async () => {
    const companies = await PlatformCompany.findAll({
      where: {
        status: COMPANY_USER_STATUS.approved,
      },
      attributes: { exclude: ['dbUserPassword', 'password', 'dbUsername'] },
      raw: true,
    });
    return companies || [];
  };

  const getAllPendingSyncCompanies = async () => {
    const companies = await getAllApprovedCompanies();
    const pendingSyncCompanies = [];
    await Promise.all(
      companies.map(async (company) => {
        const pendingSyncCompany = await PlatformCompany.findOne({
          where: {
            id: company.id,
            lastOpenDate: {
              [Sequelize.Op.not]: null,
            },
            lastCloseDate: {
              [Sequelize.Op.not]: null,
            },
            lastHoldDate: {
              [Sequelize.Op.not]: null,
            },
            lastRepossessedDate: {
              [Sequelize.Op.not]: null,
            },
            [Sequelize.Op.or]: [
              {
                lastOpenDate: {
                  [Sequelize.Op.lte]: company.approvedDate,
                },
              },
              {
                lastCloseDate: {
                  [Sequelize.Op.lte]: company.approvedDate,
                },
              },
              {
                lastHoldDate: {
                  [Sequelize.Op.lte]: company.approvedDate,
                },
              },
              {
                lastRepossessedDate: {
                  [Sequelize.Op.lte]: company.approvedDate,
                },
              },
            ],
          },
          raw: true,
        });
        if (pendingSyncCompany) {
          pendingSyncCompanies.push(pendingSyncCompany);
        }
      }),
    );
    return pendingSyncCompanies;
  };

  const getAllSyncPendingCameraScanAndHitsCompanies = async () => {
    const companies = await getAllApprovedCompanies();
    const pendingSyncCompanies = [];
    await Promise.all(
      companies.map(async (company) => {
        const pendingSyncCompany = await PlatformCompany.findOne({
          where: {
            id: company.id,
            [Sequelize.Op.and]: [
              {
                lastScannedAndHitDate: {
                  [Sequelize.Op.lte]: company.approvedDate,
                },
              },
              {
                lastScannedAndHitDate: {
                  [Sequelize.Op.not]: null,
                },
              },
            ],
          },
          raw: true,
        });
        if (pendingSyncCompany) {
          pendingSyncCompanies.push(pendingSyncCompany);
        }
      }),
    );
    return pendingSyncCompanies;
  };

  const checkRdnSyncPending = (company) => {
    let isSyncPending = false;
    const approvedDate = company.approvedDate;
    if (
      (company.lastOpenDate && company.lastOpenDate <= approvedDate) ||
      (company.lastCloseDate && company.lastCloseDate <= approvedDate) ||
      (company.lastHoldDate && company.lastHoldDate <= approvedDate) ||
      (company.lastRepossessedDate && company.lastRepossessedDate <= approvedDate)
    ) {
      isSyncPending = true;
    }
    return isSyncPending;
  };

  const checkDrnSyncDone = (company) => {
    let isDrnSyncDone = false;
    if (company.isDrnSyncDone) {
      isDrnSyncDone = true;
    }
    return isDrnSyncDone;
  };

  const checkCameraScanAndHitSyncPending = (company) => {
    let isSyncPending = false;
    const approvedDate = company.approvedDate;
    if (company.lastScannedAndHitDate && company.lastScannedAndHitDate <= approvedDate) {
      isSyncPending = true;
    }
    return isSyncPending;
  };

  const saveLastScannedAndHit = async (companyId, scannedAt) => {
    await PlatformCompany.update(
      {
        lastScannedAndHitDate: moment(scannedAt).format('YYYY-MM-DD'),
      },
      {
        where: {
          id: companyId,
        },
      },
    );
  };

  const importRdnEvents = async (dbName) => {
    const platformCompany = await PlatformCompany.findOne({
      where: {
        dbName,
      },
    });

    if (!platformCompany) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.COMPANY_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }
    return platformCompany.lastImportedRdnEventTimestamp;
  };

  const storeRdnEvents = async (dbName, rdnEventTimestamp) => {
    const platformCompany = await PlatformCompany.findOne({
      where: {
        dbName,
      },
    });

    if (!platformCompany) {
      const err = {
        status: httpStatus.UNPROCESSABLE_ENTITY,
        message: messageConstants.COMPANY_DOES_NOT_EXIST,
      };
      throw new APIError(err);
    }

    platformCompany.lastImportedRdnEventTimestamp = rdnEventTimestamp;
    await platformCompany.save();
  };

  const sendMailToAdminsForCompleteCompanyRegistration = async (companyUserId) => {
    serverLogger.info(`===> Enter in Email sent to admin method`);
    const platformCompany = await PlatformCompany.findOne({
      where: {
        id: companyUserId,
      },
      raw: true,
    });
    const systemAdminRole = await PlatformRole.findOne({
      where: {
        role: SYSTEM_ADMIN_ROLE,
      },
    });
    const systemAdminUsers = await PlatformCompany.findAll({
      where: {
        roleId: systemAdminRole.id,
      },
      raw: true,
    });
    await Promise.all(
      systemAdminUsers.map(async (systemAdminUser) => {
        try {
          const mailConfig = mailService().config({
            to: systemAdminUser.email,
            subject: 'Company registration completed',
            template: 'company-registration-completion',
            templateOptions: {
              company: platformCompany,
            },
            emailReplyAddress: emailReplyAddress || systemAdminUser.emailReplyAddress,
          });
          await mailService().send(mailConfig);
          serverLogger.info(`===> Email sent to admin ${systemAdminUser.email}`);
        } catch (e) {
          serverLogger.log({
            operationName: 'sendMailError',
            message: `===> Error on admin When company registration completion ${systemAdminUser.email}: ${e}`,
            error: e,
            level: 'error',
          });
        }
      }),
    );
  };
  const sendMailToAdminsForMissingRdnData = async (company) => {
    const { User } = await getCompanyDatabase(company.dbName);
    const users = await User.findAll({
      where: {
        status: 'ACTIVE',
      },
      raw: true,
    });
    serverLogger.info(`===> Enter in Email sent to admin method`);
    await Promise.all(
      users.map(async (users) => {
        try {
          const mailConfig = mailService().config({
            to: users.email,
            subject: 'RDN Missing Data',
            template: 'rdn-data-missing',
          });
          await mailService().send(mailConfig);
        } catch (e) {
          serverLogger.log({
            operationName: 'sendMailError',
            message: `===> Error on admin When Missing RDN Data ${users.email}: ${e}`,
            error: e,
            level: 'error',
          });
        }
      }),
    );
  };

  return {
    getAndSubBranchList,
    getRdnAndDbUsersList,
    getUsersList,
    getSpecificUser,
    checkUserSession,
    setUserSession,
    syncCompanyDB,
    getCompanyDatabase,
    addOrEditCompanyDetails,
    createBucketAndFolder,
    changeRequestRegistrationStatus,
    registerUnknownCompany,
    sendMailToSystemAdmin,
    sendMailToUnknownUser,
    getAllApprovedCompanies,
    importRdnEvents,
    storeRdnEvents,
    getAllPendingSyncCompanies,
    checkRdnSyncPending,
    checkCameraScanAndHitSyncPending,
    saveLastScannedAndHit,
    getAllSyncPendingCameraScanAndHitsCompanies,
    checkDrnSyncDone,
    sendMailToAdminsForCompleteCompanyRegistration,
    sendMailToAdminsForMissingRdnData,
    getCompanyConnection,
  };
};

module.exports = companyService;
