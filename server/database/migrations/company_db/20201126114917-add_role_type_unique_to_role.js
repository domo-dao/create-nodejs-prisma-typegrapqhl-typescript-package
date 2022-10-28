"use strict";

const {
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
    return queryInterface.addColumn("roles", "type", {
      type: Sequelize.ENUM(
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
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
