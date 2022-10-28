"use strict";

module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    "Location",
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
      tableName: "locations",
      underscored: true
    }
  );

  Location.prototype.sanitized = function () {
    return {
      id: this.id,
      lat: this.lat,
      lng: this.lng,
      address: this.address,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Location;
};
