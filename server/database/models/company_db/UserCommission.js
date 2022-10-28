"use strict";

const {
  COMMISSION_TYPES,
  COMMISSION_STATUSES
} = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const UserCommission = sequelize.define(
    "UserCommission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      reviewedById: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      shiftId: {
        type: DataTypes.INTEGER
      },
      shiftName: {
        type: DataTypes.STRING
      },
      commissionDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      commissionType: {
        type: DataTypes.ENUM(
          COMMISSION_TYPES.individual,
          COMMISSION_TYPES.team,
          COMMISSION_TYPES.per_vehicle,
          COMMISSION_TYPES.custom
        ),
        allowNull: false
      },
      commissionStatus: {
        type: DataTypes.ENUM(
          COMMISSION_STATUSES.approved,
          COMMISSION_STATUSES.pending,
          COMMISSION_STATUSES.declined
        ),
        allowNull: false,
        defaultValue: COMMISSION_STATUSES.approved
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      note: {
        type: DataTypes.TEXT
      },
      hittingCountOnIndividual: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      hittingTierOnTeam: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      involuntaryRepos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      voluntaryRepos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      updatedById: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      updatedDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      actionDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      history: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "user_commissions",
      underscored: true
    }
  );

  UserCommission.associate = function (models) {
    UserCommission.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    UserCommission.belongsTo(
      models.User,
      {
        as: "reviewedBy",
        foreignKey: "reviewedById"
      },
      {
        as: "updatedBy",
        foreignKey: "updatedById"
      }
    );
    UserCommission.belongsTo(models.Shift, {
      as: "shift",
      foreignKey: "shiftId"
    });
  };

  UserCommission.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      reviewedById: this.reviewedById,
      shiftId: this.shiftId,
      commissionDate: this.commissionDate,
      commissionType: this.commissionType,
      commissionStatus: this.commissionStatus,
      amount: this.amount,
      note: this.note,
      hittingCountOnIndividual: this.hittingCountOnIndividual,
      hittingTierOnTeam: this.hittingTierOnTeam,
      involuntaryRepos: this.involuntaryRepos, // team involuntary repos when team commission
      voluntaryRepos: this.voluntaryRepos, // team voluntary repos when team commission
      updatedById: this.updatedById,
      updatedDate: this.updatedDate,
      actionDate: this.actionDate,
      history: this.history
    };
  };

  return UserCommission;
};
