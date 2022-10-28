'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addIndex('cases', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('cases', ['status']);
  },
};
