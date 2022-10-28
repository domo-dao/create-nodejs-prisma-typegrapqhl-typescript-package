"use strict";

const Constants = require("../../config/constants");
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable("company_subscription_details", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      stripe_customer_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      stripe_subscription_id: {
        type: Sequelize.STRING,
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM(Object.values(Constants.subscription_types)),
        allowNull: false,
        defaultValue: Constants.subscription_types.basic
      },
      status: {
        type: Sequelize.ENUM(
          Object.values(Constants.company_subscription_status)
        ),
        allowNull: false,
        defaultValue: Constants.company_subscription_status.inactive
      },
      subscription_id: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable("company_subscription_details");
  }
};
