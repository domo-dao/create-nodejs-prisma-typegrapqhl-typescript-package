"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("platform_company_sessions");
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
