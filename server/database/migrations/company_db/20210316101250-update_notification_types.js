"use strict";

const { NOTIFICATION_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("notifications", "type", {
      type: Sequelize.ENUM(
        NOTIFICATION_TYPES.task_created,
        NOTIFICATION_TYPES.task_closed,
        NOTIFICATION_TYPES.task_completed,
        NOTIFICATION_TYPES.task_uncompleted,
        NOTIFICATION_TYPES.task_approved_new_deadline,
        NOTIFICATION_TYPES.task_declined_new_deadline,
        NOTIFICATION_TYPES.task_proposed_new_deadline,
        NOTIFICATION_TYPES.task_cancelled_new_deadline,
        NOTIFICATION_TYPES.task_marked_as_completed,
        NOTIFICATION_TYPES.task_alloted_time_reminder,
        NOTIFICATION_TYPES.shift_start_later,
        NOTIFICATION_TYPES.shift_end_early,
        NOTIFICATION_TYPES.shift_inactivity,
        NOTIFICATION_TYPES.shift_being_idle,
        NOTIFICATION_TYPES.shift_break_start,
        NOTIFICATION_TYPES.shift_break_over_time,
        NOTIFICATION_TYPES.shift_pause_start,
        NOTIFICATION_TYPES.shift_end_over_time,
        NOTIFICATION_TYPES.shift_failed_checklist,
        NOTIFICATION_TYPES.shift_manual_hot_list,
        NOTIFICATION_TYPES.custom_commission_request
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
