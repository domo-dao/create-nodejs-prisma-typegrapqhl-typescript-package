"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.changeColumn("geo_locations", "lat", {
        type: Sequelize.DOUBLE
      }),
      queryInterface.changeColumn("geo_locations", "lng", {
        type: Sequelize.DOUBLE
      })
    ]);
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn("geo_locations", "lat"),
      queryInterface.removeColumn("geo_locations", "lng")
    ]);
  }
};
