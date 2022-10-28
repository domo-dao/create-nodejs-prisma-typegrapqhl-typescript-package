"use strict";

const { DEVICE_TYPES } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define(
    "Session",
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
      device: {
        type: DataTypes.ENUM(DEVICE_TYPES.web, DEVICE_TYPES.mobile),
        allowNull: false
      },
      deviceId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      deviceToken: {
        type: DataTypes.STRING
      },
      loggedIn: {
        type: DataTypes.DATE
      },
      expiresIn: {
        type: DataTypes.INTEGER
      },
      token: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: "sessions",
      underscored: true
    }
  );

  Session.associate = function (models) {
    Session.belongsTo(models.User, {
      as: "user",
      foreignKey: "userId"
    });
  };

  Session.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      deviceToken: this.deviceToken,
      deviceId: this.deviceId,
      device: this.device,
      lastLoggedIn: this.lastLoggedIn,
      expiresIn: this.expiresIn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      jwtToken: this.jwtToken
    };
  };

  return Session;
};
