"use strict";

const {
  SHIFT_FEED_CATEGORIES,
  SHIFT_FEED_TYPES
} = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("shift_feed", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      object_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(
          SHIFT_FEED_CATEGORIES.alert,
          SHIFT_FEED_CATEGORIES.infraction,
          SHIFT_FEED_CATEGORIES.commission,
          SHIFT_FEED_CATEGORIES.failed_checklist,
          SHIFT_FEED_CATEGORIES.manual_hot_list
        ),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(
          SHIFT_FEED_TYPES.shift_start_later,
          SHIFT_FEED_TYPES.shift_end_early,
          SHIFT_FEED_TYPES.shift_inactivity,
          SHIFT_FEED_TYPES.shift_being_idle,
          SHIFT_FEED_TYPES.shift_break_start,
          SHIFT_FEED_TYPES.shift_break_over_time,
          SHIFT_FEED_TYPES.shift_pause_start,
          SHIFT_FEED_TYPES.shift_failed_checklist,
          SHIFT_FEED_TYPES.shift_manual_hot_list,
          SHIFT_FEED_TYPES.custom_commission_request
        ),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.
    */
    return queryInterface.dropTable("shift_feed");
  }
};
