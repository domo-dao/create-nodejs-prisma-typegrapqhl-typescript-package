"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(
        "ALTER TABLE `cases` ADD COLUMN `vinLastEight` VARCHAR(8) GENERATED ALWAYS AS (IF(ISNULL(vin),null,SUBSTRING(vin,-8))) STORED"
      );
    } catch (e) {
      await queryInterface.sequelize.query(
        "ALTER TABLE `cases` MODIFY COLUMN `vinLastEight` VARCHAR(8) GENERATED ALWAYS AS (IF(ISNULL(vin),null,SUBSTRING(vin,-8))) STORED"
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
