"use strict";

const { BREAK_TIME_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.changeColumn("break_times", "type", {
      type: Sequelize.ENUM(
        BREAK_TIME_TYPES.break,
        BREAK_TIME_TYPES.pause,
        BREAK_TIME_TYPES.idle,
        BREAK_TIME_TYPES.offline,
        BREAK_TIME_TYPES.idle_offline,
        BREAK_TIME_TYPES.inactivity
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
