'use strict';

module.exports = {
  up: async (queryInterface) => {
    const [roles] = await queryInterface.sequelize.query('SELECT id, name FROM roles');
    const validRolesIds = roles.map((role) => role.id);

    if (validRolesIds.length > 0) {
      const [testUsers] = await queryInterface.sequelize.query(
        'SELECT id, role_id, first_name, last_name FROM users WHERE role_id NOT IN (:validRolesIds)',
        {
          replacements: {
            validRolesIds,
          },
        },
      );

      // console.log(testUsers);
      // throw new Error(JSON.stringify(testUsers));

      if (validRolesIds.length > 0 && testUsers.length > 0) {
        await queryInterface.sequelize.query('DELETE FROM users WHERE role_id NOT IN (:validBranchesIds)', {
          replacements: {
            validBranchesIds: validRolesIds,
          },
        });
      }
    }

    await queryInterface.addConstraint('users', {
      type: 'foreign key',
      name: 'fk_role_id',
      fields: ['role_id'],
      references: {
        //Required field
        table: 'roles',
        field: 'id',
      },
      onDelete: 'restrict',
      onUpdate: 'cascade',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeConstraint('users', 'fk_role_id');
  },
};
