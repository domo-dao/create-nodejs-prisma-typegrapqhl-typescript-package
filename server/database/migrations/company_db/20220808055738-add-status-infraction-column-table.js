"use strict";

const { INFRACTION_STATUS } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("infractions", "status", {
      type: Sequelize.ENUM(INFRACTION_STATUS.draft, INFRACTION_STATUS.saved),
      allowNull: true,
      defaultValue: INFRACTION_STATUS.draft
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("infractions", "status");
  }
};
