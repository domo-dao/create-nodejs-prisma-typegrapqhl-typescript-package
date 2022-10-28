'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('user_activities', 'update_note', {
      type: Sequelize.DataTypes.TEXT,
      allowNull: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.changeColumn('user_activities', 'update_note', {
      type: Sequelize.DataTypes.TEXT,
      allowNull: false,
    });
  },
};
