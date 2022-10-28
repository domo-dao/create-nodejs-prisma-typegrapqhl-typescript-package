"use strict";

const { INFRACTION_TYPES } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const Infraction = sequelize.define(
    "Infraction",
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
      adminId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      shiftFeedId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      showAfter: {
        type: DataTypes.DATE,
        allowNull: true
      },
      objectId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          INFRACTION_TYPES.shift_start_later,
          INFRACTION_TYPES.shift_end_early,
          INFRACTION_TYPES.shift_inactivity,
          INFRACTION_TYPES.shift_being_idle,
          INFRACTION_TYPES.shift_being_offline,
          INFRACTION_TYPES.shift_being_idle_offline,
          INFRACTION_TYPES.shift_break_over_time,
          INFRACTION_TYPES.task_not_completed_in_time,
          INFRACTION_TYPES.location_value_invalid
        ),
        allowNull: false
      },
      infractionTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "infractions",
      underscored: true
    }
  );

  Infraction.associate = function (models) {
    Infraction.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    Infraction.belongsTo(models.User, {
      as: "admin",
      foreignKey: "adminId"
    });
    Infraction.belongsTo(models.ShiftFeed, {
      as: "shiftFeed",
      foreignKey: "shiftFeedId"
    });
  };

  Infraction.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      adminId: this.adminId,
      shiftFeedId: this.shiftFeedId,
      showAfter: this.showAfter,
      objectId: this.objectId,
      type: this.type,
      infractionTime: this.infractionTime,
      reason: this.reason,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Infraction;
};
