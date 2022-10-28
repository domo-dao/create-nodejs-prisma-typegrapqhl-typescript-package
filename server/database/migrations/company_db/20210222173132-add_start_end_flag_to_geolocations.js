"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("geo_locations", "start_of_route", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }),
      queryInterface.addColumn("geo_locations", "end_of_route", {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
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
