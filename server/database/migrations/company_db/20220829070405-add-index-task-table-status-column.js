'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addIndex('tasks', ['status']);
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeIndex('tasks', ['status']);
  },
};
