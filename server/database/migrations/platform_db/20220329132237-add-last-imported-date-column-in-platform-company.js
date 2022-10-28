"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("platform_companies", "last_open_date", {
        type: Sequelize.DATE
      }),
      queryInterface.addColumn("platform_companies", "last_close_date", {
        type: Sequelize.DATE
      }),
      queryInterface.addColumn("platform_companies", "last_hold_date", {
        type: Sequelize.DATE
      }),
      queryInterface.addColumn("platform_companies", "last_repossessed_date", {
        type: Sequelize.DATE
      }),
      queryInterface.addColumn(
        "platform_companies",
        "last_scanned_and_hit_date",
        {
          type: Sequelize.DATE
        }
      )
    ]);
  },

  down: async queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("platform_companies", "last_open_date"),
      queryInterface.removeColumn("platform_companies", "last_close_date"),
      queryInterface.removeColumn("platform_companies", "last_hold_date"),
      queryInterface.removeColumn(
        "platform_companies",
        "last_repossessed_date"
      ),
      queryInterface.removeColumn(
        "platform_companies",
        "last_scanned_and_hit_date"
      )
    ]);
  }
};
