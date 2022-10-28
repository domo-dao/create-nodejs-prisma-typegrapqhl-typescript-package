"use strict";

const { BREAK_TIME_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("break_times", "type", {
        type: Sequelize.ENUM(
          BREAK_TIME_TYPES.break,
          BREAK_TIME_TYPES.pause,
          BREAK_TIME_TYPES.idle,
          BREAK_TIME_TYPES.inactivity
        ),
        allowNull: false
      }),
      queryInterface.addColumn("break_times", "note", {
        type: Sequelize.TEXT
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
