"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("platform_password_reset_tokens");
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
