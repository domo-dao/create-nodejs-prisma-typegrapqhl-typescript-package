"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addIndex("users", ["rdn_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeIndex("users", ["rdn_id"]);
  }
};
