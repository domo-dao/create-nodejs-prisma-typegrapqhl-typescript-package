"use strict";

module.exports = (sequelize, DataTypes) => {
  const DrivingSession = sequelize.define(
    "DrivingSession",
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
      startPointId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      endPointId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      startDrivingSessionTime: {
        type: DataTypes.DATE,
        allowNull: false
      },
      endDrivingSessionTime: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null
      }
    },
    {
      tableName: "driving_sessions",
      underscored: true
    }
  );

  DrivingSession.associate = function (models) {
    DrivingSession.belongsTo(models.ShiftTime, {
      as: "shiftTime",
      foreignKey: "shiftTimeId"
    });
    DrivingSession.belongsTo(models.Location, {
      as: "startPoint",
      foreignKey: "startPointId"
    });
    DrivingSession.belongsTo(models.Location, {
      as: "endPoint",
      foreignKey: "endPointId"
    });
  };

  DrivingSession.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftTimeId: this.shiftTimeId,
      startPointId: this.startPointId,
      endPointId: this.endPointId,
      startDrivingSessionTime: this.startDrivingSessionTime,
      endDrivingSessionTime: this.endDrivingSessionTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return DrivingSession;
};
