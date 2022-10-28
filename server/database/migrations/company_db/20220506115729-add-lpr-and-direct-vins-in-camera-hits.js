"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn("camera_hits", "lpr_vins", {
        type: Sequelize.STRING(10000),
        allowNull: true
      }),
      queryInterface.addColumn("camera_hits", "direct_hits_vins", {
        type: Sequelize.STRING(10000),
        allowNull: true
      })
    ]);
  },

  down: async queryInterface => {
    return Promise.all([
      queryInterface.removeColumn("camera_hits", "lpr_vins"),
      queryInterface.removeColumn("camera_hits", "direct_hits_vins")
    ]);
  }
};
