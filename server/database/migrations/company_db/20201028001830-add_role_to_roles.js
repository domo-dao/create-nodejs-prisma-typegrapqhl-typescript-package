"use strict";

const {
  SUPER_ADMIN_ROLE,
  ADMIN_ROLE,
  MANAGER_ROLE,
  DRIVER_ROLE
} = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("roles", "role", {
      type: Sequelize.ENUM(
        SUPER_ADMIN_ROLE,
        ADMIN_ROLE,
        MANAGER_ROLE,
        DRIVER_ROLE
      ),
      allowNull: false
    });
  },

  down: (queryInterface, Sequelize) => {
    /*
      Add reverting commands here.
      Return a promise to correctly handle asynchronicity.

      Example:
      return queryInterface.dropTable('users');
    */
  }
};
