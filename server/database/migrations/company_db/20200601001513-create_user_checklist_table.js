"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("user_checklist", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      admin_id: {
        type: Sequelize.INTEGER
      },
      category: {
        type: Sequelize.ENUM(
          "new_hire",
          "terminate",
          "start_shift",
          "end_shift"
        ),
        allowNull: false
      },
      shift_time_id: {
        type: Sequelize.INTEGER
      },
      checklist: {
        type: Sequelize.TEXT,
        allowNull: false
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
    return queryInterface.dropTable("user_checklist");
  }
};
