"use strict";

module.exports = (sequelize, DataTypes) => {
  const CameraHit = sequelize.define(
    "CameraHit",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      scannedAt: {
        type: DataTypes.STRING,
        allowNull: false
      },
      drnId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      count: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      lpr: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      direct: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lprVins: {
        type: DataTypes.STRING(10000),
        allowNull: true
      },
      directHitsVins: {
        type: DataTypes.STRING(10000),
        allowNull: true
      }
    },
    {
      tableName: "camera_hits",
      underscored: true
    }
  );

  CameraHit.prototype.sanitized = function () {
    return {
      id: this.id,
      scannedAt: this.scannedAt,
      drnId: this.drnId,
      count: this.count,
      lpr: this.lpr,
      direct: this.direct
    };
  };

  return CameraHit;
};
