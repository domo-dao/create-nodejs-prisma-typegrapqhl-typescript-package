"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("break_times", "map_image", {
      type: Sequelize.TEXT,
      allowNull: true,
      defaultValue: "https://insightt-videos.s3.us-east-2.amazonaws.com/map.png"
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("break_times", "map_image");
  }
};
