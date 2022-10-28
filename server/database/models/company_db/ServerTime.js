"use strict";

module.exports = (sequelize, DataTypes) => {
  const ServerTime = sequelize.define(
    "ServerTime",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      timezone: {
        type: DataTypes.STRING,
        allowNull: false
      },
      timezoneOffset: {
        type: DataTypes.DOUBLE,
        defaultValue: 0,
        allowNull: false
      }
    },
    {
      tableName: "server_time",
      underscored: true
    }
  );

  ServerTime.prototype.sanitized = function () {
    return {
      id: this.id,
      label: this.label,
      timezone: this.timezone
    };
  };

  return ServerTime;
};
