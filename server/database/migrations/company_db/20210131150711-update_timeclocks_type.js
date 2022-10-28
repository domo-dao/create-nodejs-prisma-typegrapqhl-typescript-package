"use strict";

const { TIME_CLOCK_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("time_clocks", "type", {
      type: Sequelize.ENUM(
        TIME_CLOCK_TYPES.break,
        TIME_CLOCK_TYPES.activity_tracker,
        TIME_CLOCK_TYPES.motion_tracker
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
