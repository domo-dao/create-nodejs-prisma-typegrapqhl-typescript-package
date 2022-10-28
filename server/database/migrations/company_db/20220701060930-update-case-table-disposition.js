"use strict";

const { DISPOSITION_STATUS } = require("../../../constants/app.constants");

module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn("cases", "disposition", {
        type: Sequelize.ENUM(Object.values(DISPOSITION_STATUS))
      }),
      queryInterface.addColumn("cases", "stored_start_date", {
        type: Sequelize.DATE,
        allowNull: true
      }),
      queryInterface.addColumn("cases", "stored_end_date", {
        type: Sequelize.DATE,
        allowNull: true
      })
    ]);
  },

  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn("cases", "disposition"),
      queryInterface.removeColumn("cases", "stored_start_date"),
      queryInterface.removeColumn("cases", "stored_end_date")
    ]);
  }
};
