"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("sub_branches", "zip_codes", {
      type: Sequelize.TEXT,
      defaultValue: null
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("sub_branches", "zip_codes");
  }
};
