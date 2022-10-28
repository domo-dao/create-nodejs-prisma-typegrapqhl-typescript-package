"use strict";

module.exports = (sequelize, DataTypes) => {
  const Device = sequelize.define(
    "Device",
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
      buildNumber: {
        type: DataTypes.STRING,
        allowNull: false
      },
      deviceVersion: {
        type: DataTypes.STRING,
        allowNull: false
      },
      deviceOs: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "devices",
      underscored: true
    }
  );

  Device.associate = function (models) {
    Device.belongsTo(models.User, { as: "user", foreignKey: "userId" });
  };

  Device.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      buildNumber: this.buildNumber,
      deviceVersion: this.deviceVersion,
      deviceOs: this.deviceOs,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Device;
};
