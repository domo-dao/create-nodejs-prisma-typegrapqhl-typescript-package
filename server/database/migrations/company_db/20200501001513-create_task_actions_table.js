"use strict";

const { TASK_STATUSES } = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("task_actions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(
          TASK_STATUSES.open,
          TASK_STATUSES.closed,
          TASK_STATUSES.completed,
          TASK_STATUSES.new_deadline_proposed,
          TASK_STATUSES.new_deadline_approved,
          TASK_STATUSES.new_deadline_cancelled,
          TASK_STATUSES.new_deadline_declined,
          TASK_STATUSES.marked_as_completed,
          TASK_STATUSES.uncompleted,
          TASK_STATUSES.acknowledged_uncompleted
        ),
        allowNull: false
      },
      new_completion_date: {
        type: Sequelize.DATE
      },
      note: {
        type: Sequelize.TEXT
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
    return queryInterface.dropTable("task_actions");
  }
};
