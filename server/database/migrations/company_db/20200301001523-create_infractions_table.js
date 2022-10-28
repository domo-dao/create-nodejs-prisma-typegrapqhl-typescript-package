"use strict";

const { INFRACTION_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("infractions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      admin_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      object_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(
          INFRACTION_TYPES.shift_start_later,
          INFRACTION_TYPES.shift_end_early,
          INFRACTION_TYPES.shift_inactivity,
          INFRACTION_TYPES.shift_being_idle,
          INFRACTION_TYPES.shift_break_over_time,
          INFRACTION_TYPES.task_not_completed_in_time
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
    return queryInterface.dropTable("infractions");
  }
};
