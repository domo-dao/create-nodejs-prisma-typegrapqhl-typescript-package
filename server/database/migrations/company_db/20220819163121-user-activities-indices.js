'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [duplicates] = await queryInterface.sequelize.query(
      'SELECT count(update_id) as duplicateCounts, update_id as updateId FROM user_activities GROUP by update_id HAVING COUNT(update_id) > 1',
    );

    for (const update of duplicates) {
      await queryInterface.sequelize.query(
        'DELETE FROM user_activities WHERE update_id = :updateId LIMIT :limit',
        {
          replacements: {
            updateId: update.updateId,
            limit: update.duplicateCounts - 1,
          },
        },
      );
    }

    return queryInterface.removeIndex('user_activities', 'user_activities_case_id_update_id').then(() => {
      return queryInterface
        .addIndex('user_activities', {
          fields: ['update_id'],
          name: 'update_id_index',
          unique: true,
          concurrently: true,
        })
        .then(() => {
          return queryInterface.addIndex('user_activities', {
            fields: ['case_id'],
            name: 'case_id_index',
            unique: false,
            concurrently: true,
          });
        });
    });
  },
  down: async (queryInterface, Sequelize) => {},
};
