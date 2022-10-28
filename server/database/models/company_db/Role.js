"use strict";

const {
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  MANAGER_ROLE,
  DRIVER_ROLE,
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
  const Role = sequelize.define(
    "Role",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          SUPER_ADMIN,
          ADMINISTRATOR,
          ADMIN_REP,
          BRANCH_MANAGER,
          INVESTIGATOR,
          RECOVERY_AGENT,
          SPOTTER,
          CAMERA_CAR
        ),
        allowNull: false
      },
      role: {
        type: DataTypes.ENUM(
          SUPER_ADMIN_ROLE,
          ADMIN_ROLE,
          MANAGER_ROLE,
          DRIVER_ROLE
        ),
        allowNull: false
      }
    },
    {
      tableName: "roles",
      underscored: true
    }
  );

  Role.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name
    };
  };

  return Role;
};
