"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("user_activities", "type", {
        type: Sequelize.TEXT,
        allowNull: true
      }),
      queryInterface.addColumn("user_activities", "target_user_id", {
        type: Sequelize.INTEGER,
        allowNull: true
      }),
      queryInterface.changeColumn("user_activities", "user_id", {
        type: Sequelize.INTEGER,
        allowNull: true
      }),
      queryInterface.changeColumn("user_activities", "case_id", {
        type: Sequelize.STRING,
        allowNull: true
      }),
      queryInterface.changeColumn("user_activities", "update_id", {
        type: Sequelize.STRING,
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
