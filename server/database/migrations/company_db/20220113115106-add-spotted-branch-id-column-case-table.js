"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("cases", "spotted_branch_id", {
      type: Sequelize.INTEGER,
      defaultValue: null
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("cases", "spotted_branch_id");
  }
};
