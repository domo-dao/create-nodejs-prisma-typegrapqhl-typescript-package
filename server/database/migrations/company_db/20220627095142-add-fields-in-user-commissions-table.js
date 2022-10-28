"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("user_commissions", "updated_by_id", {
        type: Sequelize.INTEGER,
        allowNull: true
      }),
      queryInterface.addColumn("user_commissions", "updated_date", {
        type: Sequelize.DATE,
        allowNull: true
      }),
      queryInterface.addColumn("user_commissions", "action_date", {
        type: Sequelize.DATE,
        allowNull: true
      }),
      queryInterface.addColumn("user_commissions", "history", {
        type: Sequelize.STRING,
        allowNull: true
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("user_commissions", "updated_by_id"),
      queryInterface.removeColumn("user_commissions", "updated_date"),
      queryInterface.removeColumn("user_commissions", "action_date"),
      queryInterface.removeColumn("user_commissions", "history")
    ]);
  }
};
