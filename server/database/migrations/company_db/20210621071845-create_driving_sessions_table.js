"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.createTable("driving_sessions", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      shift_time_Id: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      start_point_id: {
        allowNull: true,
        defaultValue: null,
        type: Sequelize.INTEGER
      },
      end_point_id: {
        allowNull: true,
        defaultValue: null,
        type: Sequelize.INTEGER
      },
      start_driving_session_time: {
        allowNull: false,
        type: Sequelize.DATE
      },
      end_driving_session_time: {
        allowNull: true,
        defaultValue: null,
        type: Sequelize.DATE
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.dropTable("driving_sessions");
  }
};
