"use strict";

module.exports = (sequelize, DataTypes) => {
  const PlatformLocation = sequelize.define(
    "PlatformLocation",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      lat: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      lng: {
        type: DataTypes.DOUBLE,
        allowNull: false
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "platform_locations",
      underscored: true
    }
  );

  PlatformLocation.prototype.sanitized = function () {
    return {
      id: this.id,
      lat: this.lat,
      lng: this.lng,
      address: this.address,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return PlatformLocation;
};
