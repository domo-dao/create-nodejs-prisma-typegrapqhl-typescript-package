"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("shift_times", "shift_period_start_time", {
        type: Sequelize.DATE
      }),
      queryInterface.addColumn("shift_times", "shift_period_end_time", {
        type: Sequelize.DATE
      })
    ]);
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
