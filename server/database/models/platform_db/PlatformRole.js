"use strict";

const {
  SYSTEM_ADMIN_ROLE,
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  MANAGER_ROLE,
  DRIVER_ROLE,
  SYSTEM_ADMIN,
  SUPER_ADMIN,
  ADMINISTRATOR,
  ADMIN_REP,
  BRANCH_MANAGER,
  INVESTIGATOR,
  RECOVERY_AGENT,
  SPOTTER,
  CAMERA_CAR
} = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const PlatformRole = sequelize.define(
    "PlatformRole",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          SYSTEM_ADMIN,
          SUPER_ADMIN,
          ADMINISTRATOR,
          ADMIN_REP,
          BRANCH_MANAGER,
          INVESTIGATOR,
          RECOVERY_AGENT,
          SPOTTER,
          CAMERA_CAR
        ),
        unique: true,
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM(
          SYSTEM_ADMIN_ROLE,
          SUPER_ADMIN_ROLE,
          ADMIN_ROLE,
          MANAGER_ROLE,
          DRIVER_ROLE
        ),
        allowNull: false
      }
    },
    {
      tableName: "platform_roles",
      underscored: true
    }
  );

  PlatformRole.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name
    };
  };

  return PlatformRole;
};
