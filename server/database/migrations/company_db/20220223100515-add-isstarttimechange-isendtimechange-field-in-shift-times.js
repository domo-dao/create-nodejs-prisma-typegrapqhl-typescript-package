"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("shift_times", "is_start_time_change", {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }),
      queryInterface.addColumn("shift_times", "is_end_time_change", {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
    ]);
  },

  down: async queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("shift_times", "is_start_time_change"),
      queryInterface.removeColumn("shift_times", "is_end_time_change")
    ]);
  }
};
