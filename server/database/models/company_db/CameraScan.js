"use strict";

module.exports = (sequelize, DataTypes) => {
  const CameraScan = sequelize.define(
    "CameraScan",
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
      }
    },
    {
      tableName: "camera_scans",
      underscored: true
    }
  );

  CameraScan.prototype.sanitized = function () {
    return {
      id: this.id,
      scannedAt: this.scannedAt,
      userId: this.userId,
      count: this.count
    };
  };

  return CameraScan;
};
