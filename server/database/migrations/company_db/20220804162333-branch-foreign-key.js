'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.sequelize.query(
      'ALTER TABLE cases ADD COLUMN vinLastEight VARCHAR(8) GENERATED ALWAYS AS (IF(ISNULL(vin),null,SUBSTRING(vin,1,8))) STORED',
    );
  },

  down: async (queryInterface) => {
    await queryInterface.sequelize.query('ALTER TABLE cases DROP COLUMN vinLastEight');
  },
};
