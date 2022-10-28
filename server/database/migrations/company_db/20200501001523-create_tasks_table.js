"use strict";

const {
  TASK_STATUSES,
  TASK_URGENCIES
} = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("tasks", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      assigner_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      assignee_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      details: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      urgency: {
        type: Sequelize.ENUM(
          TASK_URGENCIES.high,
          TASK_URGENCIES.medium,
          TASK_URGENCIES.low
        ),
        allowNull: false
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      status: {
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
      completed_at: {
        type: Sequelize.DATE
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
    return queryInterface.dropTable("tasks");
  }
};
