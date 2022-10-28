"use strict";

const { TIME_CLOCK_TYPES } = require("../../../constants/app.constants");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("time_clocks", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shift_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM(
          TIME_CLOCK_TYPES.break,
          TIME_CLOCK_TYPES.activity_tracker
        ),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING
      },
      allowed_time: {
        type: Sequelize.INTEGER
      },
      user_group_id: {
        type: Sequelize.INTEGER
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
    return queryInterface.dropTable("time_clocks");
  }
};
