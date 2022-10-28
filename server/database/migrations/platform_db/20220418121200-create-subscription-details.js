"use strict";

const Constants = require("../../config/constants");
module.exports = {
  async up(queryInterface, Sequelize) {
    return queryInterface.createTable("subscription_details", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      price: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      allowed_users: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0 // 0 means unlimited
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      description: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      stripe_product_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      stripe_price_id: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(Object.values(Constants.subscription_types)),
        allowNull: false,
        defaultValue: Constants.subscription_types.basic
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
    return queryInterface.dropTable("subscription_details");
  }
};
