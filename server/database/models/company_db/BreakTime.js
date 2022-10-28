"use strict";

const {
  BREAK_TIME_TYPES,
  EMAIL_MAPS
} = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const BreakTime = sequelize.define(
    "BreakTime",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shiftTimeId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      lat: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      lng: {
        type: DataTypes.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: ""
      },
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      timeClockId: {
        type: DataTypes.INTEGER
      },
      type: {
        type: DataTypes.ENUM(
          BREAK_TIME_TYPES.break,
          BREAK_TIME_TYPES.pause,
          BREAK_TIME_TYPES.idle,
          BREAK_TIME_TYPES.offline,
          BREAK_TIME_TYPES.idle_offline,
          BREAK_TIME_TYPES.inactivity
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
      note: {
        type: DataTypes.TEXT
      },
      isIdleNotify: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      mapImage: {
        type: DataTypes.TEXT,
        defaultValue: EMAIL_MAPS.default_image
      }
    },
    {
      tableName: "break_times",
      underscored: true
    }
  );

  BreakTime.associate = function (models) {
    BreakTime.belongsTo(models.ShiftTime, {
      as: "shiftTime",
      foreignKey: "shiftTimeId"
    });
    BreakTime.belongsTo(models.TimeClock, {
      as: "timeClock",
      foreignKey: "timeClockId"
    });
    BreakTime.belongsTo(models.Location, {
      as: "locationMeta",
      foreignKey: "locationId"
    });
  };

  BreakTime.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftTimeId: this.shiftTimeId,
      timeClockId: this.timeClockId,
      lat: this.lat,
      lng: this.lng,
      location: this.location,
      locationId: this.locationId,
      type: this.type,
      startTime: this.startTime,
      endTime: this.endTime,
      note: this.note,
      isIdleNotify: this.isIdleNotify,
      mapImage: this.mapImage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      locationMeta: this.locationMeta
    };
  };

  return BreakTime;
};
