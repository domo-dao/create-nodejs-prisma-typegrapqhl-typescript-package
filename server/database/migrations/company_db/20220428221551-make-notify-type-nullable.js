"use strict";

const { NOTIFY_TYPE } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.changeColumn("geo_locations", "notify_type", {
      type: Sequelize.ENUM(
        NOTIFY_TYPE.idle_notify,
        NOTIFY_TYPE.offline_notify,
        NOTIFY_TYPE.idle_offline_notify,
        NOTIFY_TYPE.location_invalid_notify
      ),
      allowNull: true
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
