"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn(
        "geo_locations",
        "track_time",
        "end_track_time"
      ),
      queryInterface.addColumn("geo_locations", "start_track_time", {
        type: Sequelize.DATE,
        allowNull: true
      }),
      queryInterface.addColumn("geo_locations", "motion", {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.addColumn("geo_locations", "speed", {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: null
      }),
      queryInterface.removeColumn("geo_locations", "distance")
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.renameColumn(
        "geo_locations",
        "end_track_time",
        "track_time"
      ),
      queryInterface.removeColumn("geo_locations", "start_track_time"),
      queryInterface.removeColumn("geo_locations", "motion"),
      queryInterface.removeColumn("geo_locations", "speed"),
      queryInterface.addColumn("geo_locations", "distance", {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      })
    ]);
  }
};
