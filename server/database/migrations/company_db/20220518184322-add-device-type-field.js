"use strict";

const { DEVICE_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("shift_times", "user_device_type", {
      type: Sequelize.ENUM(DEVICE_TYPES.web, DEVICE_TYPES.mobile),
      defaultValue: DEVICE_TYPES.mobile,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("shift_times", "user_device_type");
  }
};
