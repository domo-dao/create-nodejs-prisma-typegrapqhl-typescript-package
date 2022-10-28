"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("platform_company_sessions", "device"),
      queryInterface.removeColumn("platform_company_sessions", "device_id"),
      queryInterface.removeColumn("platform_company_sessions", "device_token"),
      queryInterface.removeColumn("platform_company_sessions", "logged_in"),
      queryInterface.removeColumn("platform_company_sessions", "expires_in"),
      queryInterface.renameColumn(
        "platform_company_sessions",
        "company_user_id",
        "company_id"
      )
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
