"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("users", "hourly_rate", {
        type: Sequelize.DOUBLE,
        allowNull: true
      }),
      queryInterface.addColumn("users", "hire_date", {
        type: Sequelize.DATE,
        allowNull: true
      })
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
