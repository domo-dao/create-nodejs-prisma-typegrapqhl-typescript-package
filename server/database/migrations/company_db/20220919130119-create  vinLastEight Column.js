'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      'ALTER TABLE `cases` ADD COLUMN `vinLastEight` VARCHAR(8) GENERATED ALWAYS AS (IF(ISNULL(vin),null,SUBSTRING(vin,-8))) STORED',
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query('ALTER TABLE `cases` DROP COLUMN `vinLastEight`');
  },
};
