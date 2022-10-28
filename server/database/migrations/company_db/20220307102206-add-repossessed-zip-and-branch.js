"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("cases", "repossessed_branch_name", {
      type: Sequelize.STRING
    });
  },

  down: async queryInterface => {
    return queryInterface.removeColumn("cases", "repossessed_branch_name");
  }
};
