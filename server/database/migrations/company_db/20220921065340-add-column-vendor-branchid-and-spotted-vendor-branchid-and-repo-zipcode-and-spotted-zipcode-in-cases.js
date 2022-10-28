'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('cases', 'vendorBranchId', {
        type: Sequelize.INTEGER,
        defaultValue: null,
      }),
      queryInterface.addColumn('cases', 'spottedVendorBranchId', {
        type: Sequelize.INTEGER,
        defaultValue: null,
      }),
      queryInterface.addColumn('cases', 'repoZipCode', {
        type: Sequelize.STRING,
        defaultValue: null,
      }),
      queryInterface.addColumn('cases', 'spottedZipCode', {
        type: Sequelize.STRING,
        defaultValue: null,
      }),
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('cases', 'vendorBranchId'),
      queryInterface.removeColumn('cases', 'spottedVendorBranchId'),
      queryInterface.removeColumn('cases', 'repoZipCode'),
      queryInterface.removeColumn('cases', 'spottedZipCode'),
    ]);
  },
};
