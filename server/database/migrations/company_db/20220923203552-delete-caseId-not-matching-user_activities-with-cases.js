'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    // Delete the case_id records from user_activities table that are not in cases table
    await queryInterface.sequelize.query(
      `DELETE FROM user_activities WHERE case_id NOT IN (SELECT case_id FROM cases);`,
    );

    try {
      // Add foreign key to user_activities.case_id with ondelete and onupdate cascade using sql
      await queryInterface.sequelize.query(
        `ALTER TABLE user_activities ADD CONSTRAINT user_activities_case_id_fkey FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE ON UPDATE CASCADE;`,
      );
    } catch (e) {
      if (e.parent && e.parent.sqlMessage) {
        if (String(e.parent.sqlMessage).indexOf('duplicate key in table') === -1) {
          throw new Error(JSON.stringify(e.parent));
        }
      } else throw new Error(JSON.stringify(e.parent));
    }
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
