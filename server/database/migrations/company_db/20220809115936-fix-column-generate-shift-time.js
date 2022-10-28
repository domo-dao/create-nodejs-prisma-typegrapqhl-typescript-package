'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.sequelize.query(
        'ALTER TABLE `shift_times` ADD COLUMN `time_difference` INT(100) GENERATED ALWAYS AS (IF(ISNULL(end_time),(timestampdiff(SECOND,start_time,created_at)),(timestampdiff(SECOND,start_time,end_time)))) STORED',
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE `break_times` ADD COLUMN `break_time_diff` INT(100) GENERATED ALWAYS AS (IF(ISNULL(timestampdiff(SECOND, start_time, end_time)),0,timestampdiff(SECOND, start_time, end_time))) STORED',
      );
    } catch (e) {
      console.log('e==>', e);
      await queryInterface.sequelize.query(
        'ALTER TABLE `shift_times` MODIFY COLUMN `time_difference` INT(100) GENERATED ALWAYS AS (IF(ISNULL(end_time),(timestampdiff(SECOND,start_time,created_at)),(timestampdiff(SECOND,start_time,end_time)))) STORED',
      );
      await queryInterface.sequelize.query(
        'ALTER TABLE `break_times` MODIFY COLUMN `break_time_diff` INT(100) GENERATED ALWAYS AS (IF(ISNULL(timestampdiff(SECOND, start_time, end_time)),0,timestampdiff(SECOND, start_time, end_time))) STORED',
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:pa
     * await queryInterface.dropTable('users');
     */
  },
};
