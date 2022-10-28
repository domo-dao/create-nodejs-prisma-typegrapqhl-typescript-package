"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("geo_locations", "motion"),
      queryInterface.removeColumn("geo_locations", "speed"),
      queryInterface.addColumn("geo_locations", "distance", {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
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
