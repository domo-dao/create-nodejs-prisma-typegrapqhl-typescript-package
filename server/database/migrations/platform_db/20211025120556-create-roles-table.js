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

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("platform_roles", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(
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
        type: Sequelize.ENUM(
          SYSTEM_ADMIN_ROLE,
          SUPER_ADMIN_ROLE,
          ADMIN_ROLE,
          MANAGER_ROLE,
          DRIVER_ROLE
        ),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.dropTable("platform_roles");
  }
};
