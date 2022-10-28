"use strict";

const { CHECKLIST_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn("checklist", "category", {
      type: Sequelize.ENUM(
        CHECKLIST_TYPES.new_hire,
        CHECKLIST_TYPES.terminate,
        CHECKLIST_TYPES.start_shift,
        CHECKLIST_TYPES.end_shift,
        CHECKLIST_TYPES.activity_tracker,
        CHECKLIST_TYPES.motion_tracker
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