"use strict";

module.exports = (sequelize, DataTypes) => {
  const PlatformSetting = sequelize.define(
    "PlatformSetting",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      key: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "platform_settings",
      underscored: true
    }
  );

  PlatformSetting.prototype.sanitized = function () {
    return {
      id: this.id,
      lat: this.lat,
      lng: this.lng,
      address: this.address,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return PlatformSetting;
};
