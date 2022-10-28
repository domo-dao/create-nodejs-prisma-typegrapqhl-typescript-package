"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("platform_sub_branches");
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
