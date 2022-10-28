"use strict";

const { TIME_CLOCK_TYPES } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const TimeClock = sequelize.define(
    "TimeClock",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shiftId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          TIME_CLOCK_TYPES.break,
          TIME_CLOCK_TYPES.activity_tracker,
          TIME_CLOCK_TYPES.motion_tracker
        ),
        allowNull: false
      },
      name: {
        type: DataTypes.STRING
      },
      allowedTime: {
        type: DataTypes.INTEGER
      },
      userGroupId: {
        type: DataTypes.INTEGER
      }
    },
    {
      tableName: "time_clocks",
      underscored: true,
      paranoid: true
    }
  );

  TimeClock.associate = function (models) {
    TimeClock.belongsTo(models.Role, {
      as: "userGroup",
      foreignKey: "userGroupId"
    });
  };

  TimeClock.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftId: this.shiftId,
      type: this.type,
      name: this.name,
      allowedTime: this.allowedTime,
      userGroupId: this.userGroupId
    };
  };

  return TimeClock;
};
