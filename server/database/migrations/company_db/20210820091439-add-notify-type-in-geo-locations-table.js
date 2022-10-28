"use strict";

const { NOTIFY_TYPE } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("geo_locations", "notify_type", {
      type: Sequelize.ENUM(
        NOTIFY_TYPE.idle_notify,
        NOTIFY_TYPE.location_invalid_notify
      ),
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
