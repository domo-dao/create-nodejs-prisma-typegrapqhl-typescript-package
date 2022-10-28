"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("server_time", "timezone_offset", {
      type: Sequelize.DOUBLE,
      defaultValue: 0,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("server_time", "timezone_offset");
  }
};
