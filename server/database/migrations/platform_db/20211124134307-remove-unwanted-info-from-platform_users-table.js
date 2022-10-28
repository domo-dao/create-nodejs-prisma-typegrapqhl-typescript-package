"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("platform_users", "first_name"),
      queryInterface.removeColumn("platform_users", "last_name"),
      queryInterface.removeColumn("platform_users", "phone_number"),
      queryInterface.removeColumn("platform_users", "avatar_url"),
      queryInterface.removeColumn("platform_users", "role_id"),
      queryInterface.removeColumn("platform_users", "team_id"),
      queryInterface.removeColumn("platform_users", "branch_id"),
      queryInterface.removeColumn("platform_users", "hourly_rate"),
      queryInterface.removeColumn("platform_users", "hire_date")
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("platform_users", "first_name", {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn("platform_users", "last_name", {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn("platform_users", "phone_number", {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn("platform_users", "avatar_url", {
        type: Sequelize.STRING
      }),
      queryInterface.addColumn("platform_users", "role_id", {
        type: Sequelize.INTEGER,
        allowNull: false
      }),
      queryInterface.addColumn("platform_users", "team_id", {
        type: Sequelize.INTEGER,
        allowNull: false
      }),
      queryInterface.addColumn("platform_users", "branch_id", {
        type: Sequelize.INTEGER,
        allowNull: true
      }),
      queryInterface.addColumn("platform_users", "hourly_rate", {
        type: Sequelize.DOUBLE,
        allowNull: true
      }),
      queryInterface.addColumn("platform_users", "hire_date", {
        type: Sequelize.DATE,
        allowNull: true
      })
    ]);
  }
};
