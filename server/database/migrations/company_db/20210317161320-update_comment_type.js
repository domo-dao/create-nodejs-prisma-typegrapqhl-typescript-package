"use strict";

const { COMMENT_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("comments", "type", {
      type: Sequelize.ENUM(
        COMMENT_TYPES.checklist,
        COMMENT_TYPES.manual_hot_case
      ),
      allowNull: false
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
