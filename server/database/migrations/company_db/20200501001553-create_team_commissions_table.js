"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("team_commissions", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shift_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tier: {
        type: Sequelize.TINYINT,
        allowNull: false
      },
      repossession_goals: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      commissions: {
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
    return queryInterface.dropTable("team_commissions");
  }
};
