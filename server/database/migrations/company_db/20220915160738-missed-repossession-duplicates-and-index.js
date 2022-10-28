'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const [duplicates] = await queryInterface.sequelize.query(
      'SELECT count(caseId) as duplicateCounts, caseId FROM MissedRepossession GROUP by caseId HAVING COUNT(caseId) > 1',
    );

    for (const item of duplicates) {
      await queryInterface.sequelize.query(
        'DELETE FROM MissedRepossession WHERE caseId = :caseId ORDER BY vin ASC LIMIT :limit',
        {
          replacements: {
            caseId: item.caseId,
            limit: item.duplicateCounts - 1,
          },
        },
      );
    }

    return queryInterface.addIndex('MissedRepossession', {
      fields: ['caseId'],
      name: 'caseId_index',
      unique: true,
      concurrently: true,
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.removeIndex('MissedRepossession', 'caseId_index');
  },
};
