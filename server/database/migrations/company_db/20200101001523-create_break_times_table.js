"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("break_times", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shift_time_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      lat: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      lng: {
        type: Sequelize.DOUBLE,
        allowNull: false,
        defaultValue: 0
      },
      time_clock_id: {
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.ENUM("break", "pause", "idle"),
        allowNull: false
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE
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
    return queryInterface.dropTable("break_times");
  }
};
