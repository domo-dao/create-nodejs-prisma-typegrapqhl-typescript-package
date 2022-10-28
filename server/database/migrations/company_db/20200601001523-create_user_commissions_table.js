"use strict";

const {
  COMMISSION_TYPES,
  COMMISSION_STATUSES
} = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("user_commissions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      shift_id: {
        type: Sequelize.INTEGER
      },
      commission_day: {
        type: Sequelize.DATE,
        allowNull: false
      },
      commission_type: {
        type: Sequelize.ENUM(
          COMMISSION_TYPES.individual,
          COMMISSION_TYPES.team,
          COMMISSION_TYPES.per_vehicle,
          COMMISSION_TYPES.custom
        ),
        allowNull: false
      },
      commission_status: {
        type: Sequelize.ENUM(
          COMMISSION_STATUSES.approved,
          COMMISSION_STATUSES.pending,
          COMMISSION_STATUSES.declined
        ),
        allowNull: false,
        defaultValue: COMMISSION_STATUSES.approved
      },
      amount: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      note: {
        type: Sequelize.TEXT
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.
    */
    return queryInterface.dropTable("user_commissions");
  }
};
