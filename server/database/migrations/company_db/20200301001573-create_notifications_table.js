"use strict";

const {
  NOTIFICATION_STATUSES,
  NOTIFICATION_CATEGORIES
} = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("notifications", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM(
          NOTIFICATION_CATEGORIES.for_user,
          NOTIFICATION_CATEGORIES.for_manager
        ),
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      text: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM(
          NOTIFICATION_STATUSES.created,
          NOTIFICATION_STATUSES.read
        ),
        allowNull: false,
        defaultValue: NOTIFICATION_STATUSES.created
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
    return queryInterface.dropTable("notifications");
  }
};
