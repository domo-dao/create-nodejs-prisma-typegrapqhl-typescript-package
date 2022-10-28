"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("cases", "repo_lat", {
        type: Sequelize.DOUBLE,
        allowNull: true
      }),
      queryInterface.addColumn("cases", "repo_lng", {
        type: Sequelize.DOUBLE,
        allowNull: true
      }),
      queryInterface.addColumn("cases", "spotted_lat", {
        type: Sequelize.DOUBLE,
        allowNull: true
      }),
      queryInterface.addColumn("cases", "spotted_lng", {
        type: Sequelize.DOUBLE,
        allowNull: true
      })
    ]);
  },

  down: async queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("cases", "repo_lat"),
      queryInterface.removeColumn("cases", "repo_lng"),
      queryInterface.removeColumn("cases", "spotted_lat"),
      queryInterface.removeColumn("cases", "spotted_lng")
    ]);
  }
};
