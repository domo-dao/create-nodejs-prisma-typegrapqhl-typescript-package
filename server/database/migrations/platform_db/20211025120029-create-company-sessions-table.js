"use strict";
const { DEVICE_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("platform_company_sessions", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      company_user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      device: {
        type: Sequelize.ENUM(DEVICE_TYPES.web, DEVICE_TYPES.mobile),
        allowNull: false
      },
      device_id: {
        type: Sequelize.STRING,
        allowNull: true
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
      token: {
        type: Sequelize.STRING
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

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.dropTable("platform_company_sessions");
  }
};
