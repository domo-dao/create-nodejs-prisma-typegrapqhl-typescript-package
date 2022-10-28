"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn(
        "registration_requested_companies",
        "contact_name",
        {
          type: Sequelize.STRING,
          allowNull: false
        }
      ),
      queryInterface.addColumn(
        "registration_requested_companies",
        "contact_number",
        {
          type: Sequelize.STRING,
          allowNull: true
        }
      ),
      queryInterface.addColumn("registration_requested_companies", "feedback", {
        type: Sequelize.STRING,
        allowNull: true
      })
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn(
        "registration_requested_companies",
        "contact_name"
      ),
      queryInterface.removeColumn(
        "registration_requested_companies",
        "contact_number"
      ),
      queryInterface.removeColumn(
        "registration_requested_companies",
        "feedback"
      )
    ]);
  }
};
