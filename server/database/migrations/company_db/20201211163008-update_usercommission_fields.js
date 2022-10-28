"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn(
        "user_commissions",
        "commission_day",
        "commission_date"
      ),
      queryInterface.addColumn(
        "user_commissions",
        "hitting_count_on_individual",
        {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      ),
      queryInterface.addColumn("user_commissions", "hitting_tier_on_team", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      queryInterface.addColumn("user_commissions", "involuntary_repos", {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }),
      queryInterface.addColumn("user_commissions", "voluntary_repos", {
        type: Sequelize.INTEGER,
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
