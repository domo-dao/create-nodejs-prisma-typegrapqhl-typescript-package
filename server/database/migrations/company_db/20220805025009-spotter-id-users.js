"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addConstraint("cases", {
      type: "foreign key",
      name: "fk_spotter_id",
      fields: ["spotter_id"],
      references: {
        table: "users",
        field: "id"
      },
      onDelete: "restrict",
      onUpdate: "cascade"
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint("cases", "fk_spotter_id");
  }
};
