'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn('geo_locations', 'lat', {
        type: Sequelize.DOUBLE,
        allowNull: false,
      }),
      queryInterface.changeColumn('geo_locations', 'lng', {
        type: Sequelize.DOUBLE,
        allowNull: false,
      }),
    ]);
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  },
};
