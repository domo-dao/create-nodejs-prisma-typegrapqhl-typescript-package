'use strict';

module.exports = {
  async up(queryInterface) {
    // Retrieve the locationIds from the locations table.
    const locationIds = await queryInterface.sequelize
      .query('SELECT id FROM locations')
      ?.map((location) => location.id);

    // If the location_id from the geo_locations table doesn't match the id of the locations table, delete those records.
    if (locationIds.length > 0) {
      await queryInterface.sequelize.query('DELETE FROM geo_locations WHERE location_id NOT IN (:locationIds)', {
        replacements: {
          locationIds,
        },
      });
    }

    // Add the foreign key relationship between the geo_locations and the locations table.
    await queryInterface.addConstraint('geo_locations', {
      type: 'foreign key',
      name: 'fk_location_id_ref',
      fields: ['location_id'],
      references: {
        table: 'locations',
        field: 'id',
      },
      onDelete: 'restrict',
      onUpdate: 'cascade',
    });
  },

  async down(queryInterface) {
    // Remove the foreign key relationship between the geo_locations and the locations table.
    await queryInterface.removeConstraint('geo_locations', 'fk_location_id_ref');
  },
};
