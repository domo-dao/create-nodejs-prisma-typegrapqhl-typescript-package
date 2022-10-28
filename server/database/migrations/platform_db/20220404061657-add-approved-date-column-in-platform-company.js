"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("platform_companies", "approved_date", {
      type: Sequelize.DATE
    });
  },

  down: async queryInterface => {
    return queryInterface.removeColumn("platform_companies", "approved_date");
  }
};
