"use strict";

const { SHIFT_FEED_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.changeColumn("shift_feed", "type", {
      type: Sequelize.ENUM(
        SHIFT_FEED_TYPES.shift_start_later,
        SHIFT_FEED_TYPES.shift_end_early,
        SHIFT_FEED_TYPES.shift_inactivity,
        SHIFT_FEED_TYPES.shift_being_idle,
        SHIFT_FEED_TYPES.shift_being_offline,
        SHIFT_FEED_TYPES.shift_being_idle_offline,
        SHIFT_FEED_TYPES.shift_break_start,
        SHIFT_FEED_TYPES.shift_break_over_time,
        SHIFT_FEED_TYPES.shift_pause_start,
        SHIFT_FEED_TYPES.shift_failed_checklist,
        SHIFT_FEED_TYPES.shift_manual_hot_list,
        SHIFT_FEED_TYPES.custom_commission_request,
        SHIFT_FEED_TYPES.location_value_invalid
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
