"use strict";
const { Op } = require("sequelize");

module.exports = {
  up: async queryInterface => {
    const [branches] = await queryInterface.sequelize.query(
      "SELECT id, name FROM branches"
    );
    const validBranchesIds = branches.map(branch => branch.id);

    // const [testShifts] = await queryInterface.sequelize.query("SELECT id, branch_id FROM shifts WHERE branch_id NOT IN (:validBranchesIds)", {
    //   replacements: {
    //     validBranchesIds
    //   }
    // });
    if (validBranchesIds.length > 0) {
      await queryInterface.sequelize.query(
        "DELETE FROM shifts WHERE branch_id NOT IN (:validBranchesIds)",
        {
          replacements: {
            validBranchesIds
          }
        }
      );
    }

    await queryInterface.addConstraint("shifts", {
      type: "foreign key",
      name: "fk_branch_id",
      fields: ["branch_id"],
      references: {
        //Required field
        table: "branches",
        field: "id"
      },
      onDelete: "restrict",
      onUpdate: "cascade"
    });
  },

  down: async queryInterface => {
    await queryInterface.removeConstraint("shifts", "fk_branch_id");
  }
};
