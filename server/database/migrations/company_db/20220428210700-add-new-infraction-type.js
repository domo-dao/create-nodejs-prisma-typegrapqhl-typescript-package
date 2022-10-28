"use strict";

const { INFRACTION_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.changeColumn("infractions", "type", {
      type: Sequelize.ENUM(
        INFRACTION_TYPES.shift_start_later,
        INFRACTION_TYPES.shift_end_early,
        INFRACTION_TYPES.shift_inactivity,
        INFRACTION_TYPES.shift_being_idle,
        INFRACTION_TYPES.shift_being_offline,
        INFRACTION_TYPES.shift_being_idle_offline,
        INFRACTION_TYPES.shift_break_over_time,
        INFRACTION_TYPES.task_not_completed_in_time,
        INFRACTION_TYPES.location_value_invalid
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
