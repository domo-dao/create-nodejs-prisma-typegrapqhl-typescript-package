"use strict";

const { ALERT_METHODS } = require("../../../constants/app.constants");
module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define(
    "Alert",
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
      method: {
        type: DataTypes.ENUM(ALERT_METHODS.sms, ALERT_METHODS.email),
        allowNull: false
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      }
    },
    {
      tableName: "alerts",
      underscored: true
    }
  );

  Alert.associate = function (models) {
    Alert.belongsTo(models.User, { as: "user", foreignKey: "userId" });
  };

  Alert.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      method: this.method,
      enabled: this.enabled,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Alert;
};
