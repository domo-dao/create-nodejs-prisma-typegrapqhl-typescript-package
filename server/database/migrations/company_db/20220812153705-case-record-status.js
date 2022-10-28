"use strict";

const { CASE_RECORD_STATUS } = require("../../../constants/app.constants");
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("cases", "reposession_date_time", "repossession_date_time");

    return queryInterface.addColumn("cases", "recordStatus", {
      type: Sequelize.ENUM(Object.values(CASE_RECORD_STATUS)),
      allowNull: false,
      defaultValue: CASE_RECORD_STATUS.PROCESSED
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.renameColumn("cases", "repossession_date_time", "reposession_date_time");

    return queryInterface.removeColumn("cases", "recordStatus");
  }
};
