"use strict";

const { NOTIFY_TYPE } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const GeoLocation = sequelize.define(
    "GeoLocation",
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
      locationId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      startTrackTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      endTrackTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      startOfRoute: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      endOfRoute: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      usedForMotionTrack: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      allowedIntervalCheckpoint: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      distance: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        allowNull: false
      },
      notifyType: {
        type: DataTypes.ENUM(
          NOTIFY_TYPE.idle_notify,
          NOTIFY_TYPE.offline_notify,
          NOTIFY_TYPE.idle_offline_notify,
          NOTIFY_TYPE.location_invalid_notify
        ),
        allowNull: true,
        defaultValue: null
      },
      offline: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: "geo_locations",
      underscored: true
    }
  );

  GeoLocation.associate = function (models) {
    GeoLocation.belongsTo(models.ShiftTime, {
      as: "shiftTime",
      foreignKey: "shiftTimeId"
    });
    GeoLocation.belongsTo(models.Location, {
      as: "locationMeta",
      foreignKey: "locationId"
    });
  };

  GeoLocation.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftTimeId: this.shiftTimeId,
      lat: this.lat,
      lng: this.lng,
      locationId: this.locationId,
      startTrackTime: this.startTrackTime,
      endTrackTime: this.endTrackTime,
      startOfRoute: this.startOfRoute,
      endOfRoute: this.endOfRoute,
      usedForMotionTrack: this.usedForMotionTrack,
      allowedIntervalCheckpoint: this.allowedIntervalCheckpoint,
      distance: this.distance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      locationMeta: this.locationMeta
    };
  };

  return GeoLocation;
};
