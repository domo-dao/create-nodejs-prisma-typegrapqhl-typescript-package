"use strict";

const { DEVICE_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("sessions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      device: {
        type: Sequelize.ENUM(DEVICE_TYPES.web, DEVICE_TYPES.mobile),
        allowNull: false
      },
      device_token: {
        type: Sequelize.STRING
      },
      logged_in: {
        type: Sequelize.DATE
      },
      expires_in: {
        type: Sequelize.INTEGER
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
    return queryInterface.dropTable("sessions");
  }
};
