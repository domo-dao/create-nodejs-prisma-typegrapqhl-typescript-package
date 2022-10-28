"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addIndex("user_activities", ["case_id", "update_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeIndex("user_activities", [
      "case_id",
      "update_id"
    ]);
  }
};
