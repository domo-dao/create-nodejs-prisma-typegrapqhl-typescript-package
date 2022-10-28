"use strict";
const {
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR
} = require("../../../constants/app.constants");

const colorSet = new Set();
colorSet.add(NOTIFICATION_COLOR.default);
colorSet.add(NOTIFICATION_COLOR.RDN_Infraction);
colorSet.add(NOTIFICATION_COLOR.Idle_Infraction);
colorSet.add(NOTIFICATION_COLOR.task_created);
colorSet.add(NOTIFICATION_COLOR.task_read);
colorSet.add(NOTIFICATION_COLOR.task_unread);
colorSet.add(NOTIFICATION_COLOR.task_closed);
colorSet.add(NOTIFICATION_COLOR.task_completed);
colorSet.add(NOTIFICATION_COLOR.task_uncompleted);
colorSet.add(NOTIFICATION_COLOR.task_approved_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_declined_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_proposed_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_cancelled_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_marked_as_completed);
colorSet.add(NOTIFICATION_COLOR.task_alloted_time_reminder);
colorSet.add(NOTIFICATION_COLOR.shift_end_early);
colorSet.add(NOTIFICATION_COLOR.shift_inactivity);
colorSet.add(NOTIFICATION_COLOR.shift_being_idle);
colorSet.add(NOTIFICATION_COLOR.shift_break_start);
colorSet.add(NOTIFICATION_COLOR.shift_break_over_time);
colorSet.add(NOTIFICATION_COLOR.shift_end_over_time);
colorSet.add(NOTIFICATION_COLOR.shift_failed_checklist);
colorSet.add(NOTIFICATION_COLOR.shift_pause_start);
colorSet.add(NOTIFICATION_COLOR.shift_manual_hot_list);
colorSet.add(NOTIFICATION_COLOR.shift_nearby_spotted_vehicle);
colorSet.add(NOTIFICATION_COLOR.custom_commission_request);
colorSet.add(NOTIFICATION_COLOR.location_value_invalid);

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("notifications", "type", {
        type: Sequelize.ENUM(
          NOTIFICATION_TYPES.RDN_Infraction,
          NOTIFICATION_TYPES.Idle_Infraction,
          NOTIFICATION_TYPES.task_created,
          NOTIFICATION_TYPES.task_closed,
          NOTIFICATION_TYPES.task_completed,
          NOTIFICATION_TYPES.task_read,
          NOTIFICATION_TYPES.task_unread,
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
          NOTIFICATION_TYPES.shift_nearby_spotted_vehicle,
          NOTIFICATION_TYPES.custom_commission_request,
          NOTIFICATION_TYPES.location_value_invalid
        ),
        allowNull: false
      }),
      queryInterface.changeColumn("notifications", "color", {
        type: Sequelize.ENUM(...colorSet),
        allowNull: false,
        defaultValue: NOTIFICATION_COLOR.default
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
