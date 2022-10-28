"use strict";
const { NOTIFICATION_COLOR } = require("../../../constants/app.constants");

const colorSet = new Set();
colorSet.add(NOTIFICATION_COLOR.default);
colorSet.add(NOTIFICATION_COLOR.RDN_Infraction);
colorSet.add(NOTIFICATION_COLOR.Idle_Infraction);
colorSet.add(NOTIFICATION_COLOR.task_created);
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

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("notifications", "color", {
        type: Sequelize.ENUM(...colorSet),
        allowNull: false,
        defaultValue: NOTIFICATION_COLOR.default
      }),
      queryInterface.addColumn("notifications", "notify_for_user_id", {
        type: Sequelize.INTEGER,
        allowNull: true
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
