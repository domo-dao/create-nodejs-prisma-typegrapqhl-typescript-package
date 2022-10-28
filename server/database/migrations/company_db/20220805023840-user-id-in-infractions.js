"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // const [roles] = await queryInterface.sequelize.query(
    //   "SELECT id, name FROM roles"
    // );
    // const validRolesId = roles.map(role => role.id);

    // const [tests] = await queryInterface.sequelize.query(
    //   "SELECT id, email FROM users WHERE role_id NOT IN (:validRolesId)", {
    //     replacements: {
    //       validRolesId
    //     }
    //   });
    // throw new Error(tests);

    // if (validRolesId.length > 0) {
    //   await queryInterface.sequelize.query(
    //     "DELETE FROM shifts WHERE branch_id NOT IN (:validBranchesIds)",
    //     {
    //       replacements: {
    //         validBranchesIds: validRolesId
    //       }
    //     }
    //   );
    // }

    await queryInterface.addConstraint("infractions", {
      type: "foreign key",
      name: "fk_user_id",
      fields: ["user_id"],
      references: {
        table: "users",
        field: "id"
      },
      onDelete: "restrict",
      onUpdate: "cascade"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("infractions", "fk_user_id");
  }
};
