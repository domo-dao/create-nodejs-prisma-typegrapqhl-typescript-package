"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("infractions", "shift_feed_id", {
        type: Sequelize.INTEGER,
        allowNull: true
      }),
      queryInterface.addColumn("infractions", "show_after", {
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
