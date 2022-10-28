'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.addColumn('shift_times', 'modified_start_time', {
        type: Sequelize.DATE,
        allowNull: true,
      }),
      queryInterface.addColumn('shift_times', 'modified_end_time', {
        type: Sequelize.DATE,
        allowNull: true,
      }),
    ]);
  },

  async down(queryInterface) {
    return Promise.all([
      queryInterface.removeColumn('shift_times', 'modified_start_time'),
      queryInterface.removeColumn('shift_times', 'modified_end_time'),
    ]);
  },
};
