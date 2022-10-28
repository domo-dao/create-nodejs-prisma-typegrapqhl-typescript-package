"use strict";

const { SHIFT_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("shift_times", "shift_type", {
      type: Sequelize.ENUM(
        SHIFT_TYPES.normal_shift,
        SHIFT_TYPES.extraneous_time_tracked
      ),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
