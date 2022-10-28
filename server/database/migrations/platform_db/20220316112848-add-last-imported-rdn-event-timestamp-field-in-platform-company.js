"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn(
      "platform_companies",
      "last_imported_rdn_event_timestamp",
      {
        type: Sequelize.DATE
      }
    );
  },

  down: async queryInterface => {
    return queryInterface.removeColumn(
      "platform_companies",
      "last_imported_rdn_event_timestamp"
    );
  }
};
