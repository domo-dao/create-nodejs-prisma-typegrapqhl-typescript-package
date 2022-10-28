const httpStatus = require("http-status");
const { map } = require("lodash");
const Sequelize = require("sequelize");
const { serverLogger } = require("../config/logger");
const { UNKNOWN_BRANCH_ID, UNKNOWN } = require("../constants/app.constants");
const messageConstants = require("../constants/message.constants");
const db = require("../database/models");
const APIError = require("../utils/APIError");

const getNonEmptyZipcodeSubBranches = async dbName => {
  const companyService = require("./company.service");
  const { SubBranch } = await companyService().getCompanyDatabase(dbName);
  return await SubBranch.findAll({
    where: {
      zipCodes: {
        [Sequelize.Op.not]: null
      }
    },
    raw: true,
    nest: true
  });
};

const deleteBranch = async (dbName, branchId) => {
  const companyService = require("./company.service");
  const {
    Branch,
    SubBranch,
    Setting,
    User,
    Shift
  } = await companyService().getCompanyDatabase(dbName);
  const branch = await Branch.findOne({
    where: {
      id: branchId
    }
  });
  if (!branch) {
    const err = {
      status: httpStatus.UNPROCESSABLE_ENTITY,
      message: messageConstants.INVALID_BRANCH_ID
    };
    throw new APIError(err);
  }

  const users = await User.findAll({
    where: {
      branchId: {
        [Sequelize.Op.eq]: branchId
      }
    }
  });

  const shifts = await Shift.findAll({
    where: {
      branchId: {
        [Sequelize.Op.eq]: branchId
      }
    }
  });

  if (users.length) {
    const usersIds = map(users, "id");
    const shiftsIds = map(shifts, "id");
    serverLogger.log({
      operationName: "deleteBranch",
      message: `users exist with branch id ${branchId}`,
      payload: { dbName, usersIds, shiftsIds, branchId },
      level: "error"
    });
    const err = {
      status: httpStatus.UNPROCESSABLE_ENTITY,
      message: messageConstants.BRANCH_BELONGS_TO_OTHERE_USER,
      success: false,
      usersIds,
      shiftsIds
    };
    return err;
  }

  let transaction = await db[`${dbName}_sequelize`].transaction();
  const subBranches = await SubBranch.findAll({
    where: {
      branchId
    }
  });
  await changeCaseBranchNameAndBranchId(dbName, subBranches);

  await Promise.all([
    Branch.destroy(
      {
        where: {
          id: branchId
        }
      },
      { transaction }
    ),
    SubBranch.destroy(
      {
        where: {
          branchId
        }
      },
      { transaction }
    ),
    Shift.destroy(
      {
        where: {
          branchId
        }
      },
      { transaction }
    ),
    Setting.destroy(
      {
        where: {
          branchId
        }
      },
      { transaction }
    )
  ]);

  if (transaction) {
    return { transaction, success: true };
  }
};
const changeCaseBranchNameAndBranchId = async (dbName, subBranches) => {
  const companyService = require("./company.service");
  const { Case } = await companyService().getCompanyDatabase(dbName);

  if (subBranches.length) {
    const subBranchIds = map(subBranches, "id");
    const subBranchNames = map(subBranches, "name");

    await Promise.all([
      Case.update(
        {
          spottedBranchId: UNKNOWN_BRANCH_ID
        },
        {
          where: {
            spottedBranchId: {
              [Sequelize.Op.in]: subBranchIds
            }
          }
        }
      ),
      Case.update(
        {
          repossessedBranchName: UNKNOWN
        },
        {
          where: {
            repossessedBranchName: {
              [Sequelize.Op.in]: subBranchNames
            }
          }
        }
      )
    ]);
  }
};

const updateUserBranch = async (dbName, branchId, userId) => {
  const companyService = require("./company.service");
  const { User, Branch } = await companyService().getCompanyDatabase(dbName);
  const branch = await Branch.findOne({
    where: {
      id: branchId
    }
  });
  if (!branch) {
    const err = {
      status: httpStatus.UNPROCESSABLE_ENTITY,
      message: messageConstants.INVALID_BRANCH_ID
    };
    throw new APIError(err);
  }
  const user = await User.findOne({
    where: {
      id: userId
    }
  });
  if (!user) {
    const err = {
      status: httpStatus.UNPROCESSABLE_ENTITY,
      message: messageConstants.USER_NOT_FOUND
    };
    throw new APIError(err);
  }
  user.branchId = branchId;
  await user.save();
};

module.exports = {
  getNonEmptyZipcodeSubBranches,
  deleteBranch,
  updateUserBranch,
  changeCaseBranchNameAndBranchId
};
