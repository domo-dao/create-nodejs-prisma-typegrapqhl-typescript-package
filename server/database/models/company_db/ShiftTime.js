"use strict";

const {
  SHIFT_TYPES,
  SHIFT_STATUSES,
  DEVICE_TYPES
} = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const ShiftTime = sequelize.define(
    "ShiftTime",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shiftId: {
        type: DataTypes.INTEGER
      },
      shiftPeriodStartTime: {
        type: DataTypes.DATE
      },
      shiftPeriodEndTime: {
        type: DataTypes.DATE
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      shiftType: {
        type: DataTypes.ENUM(
          SHIFT_TYPES.normal_shift,
          SHIFT_TYPES.extraneous_time_tracked
        ),
        allowNull: false
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endTime: {
        type: DataTypes.DATE
      },
      status: {
        type: DataTypes.ENUM(
          SHIFT_STATUSES.working,
          SHIFT_STATUSES.breaking,
          SHIFT_STATUSES.paused,
          SHIFT_STATUSES.ended
        ),
        allowNull: false
      },
      userDeviceToken: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userDeviceType: {
        type: DataTypes.ENUM(DEVICE_TYPES.web, DEVICE_TYPES.mobile),
        defaultValue: DEVICE_TYPES.mobile,
        allowNull: false
      },
      manualCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      endShiftType: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isStartTimeChange: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      isEndTimeChange: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "shift_times",
      underscored: true
    }
  );

  ShiftTime.associate = function (models) {
    ShiftTime.belongsTo(models.Shift, { as: "shift", foreignKey: "shiftId" });
    ShiftTime.belongsTo(models.User, { as: "user", foreignKey: "userId" });
  };

  ShiftTime.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftId: this.shiftId,
      shiftPeriodStartTime: this.shiftPeriodStartTime,
      shiftPeriodEndTime: this.shiftPeriodEndTime,
      userId: this.userId,
      endShiftType: this.endShiftType,
      shiftType: this.shiftType,
      startTime: this.startTime,
      endTime: this.endTime,
      isStartTimeChange: this.isStartTimeChange,
      isEndTimeChange: this.isEndTimeChange,
      status: this.status,
      userDeviceToken: this.userDeviceToken,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return ShiftTime;
};
