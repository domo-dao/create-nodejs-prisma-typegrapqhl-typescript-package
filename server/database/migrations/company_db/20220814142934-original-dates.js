'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface
      .renameColumn('cases', 'repossession_date_time', 'originalRepossessionDateTime')
      .then(() => {
        return queryInterface.addColumn('cases', 'originalOrderDate', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      })
      .then(() => {
        return queryInterface.addColumn('cases', 'originalCloseDate', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      })
      .then(() => {
        return queryInterface.addColumn('cases', 'originalHoldDate', {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface
      .renameColumn('cases', 'repossession_date_time', 'originalRepossessionDateTime')
      .then(() => {
        return queryInterface.removeColumn('cases', 'orderDateDateTime');
      })
      .then(() => {
        return queryInterface.removeColumn('cases', 'closeDateDateTime');
      })
      .then(() => {
        return queryInterface.removeColumn('cases', 'holdDateDateTime');
      });
  },
};
