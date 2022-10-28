'use strict';

const { MISSED_REPOSSESSED_STATUSES, CASE_STATUSES } = require('../../../rdn/constants');
module.exports = {
  async up(queryInterface, Sequelize) {
    const charsets = ['utf8', 'latin1'];
    const promises = charsets.map(async (charset) => {
      try {
        await queryInterface.createTable(
          'MissedRepossession',
          {
            id: {
              type: Sequelize.INTEGER,
              primaryKey: true,
              autoIncrement: true,
            },
            missedDate: {
              type: Sequelize.DATE,
              allowNull: false,
            },
            caseStatus: {
              type: Sequelize.ENUM(...MISSED_REPOSSESSED_STATUSES),
              allowNull: false,
            },
            vin: {
              type: Sequelize.STRING,
              allowNull: false,
            },
            caseId: {
              type: Sequelize.STRING,
              allowNull: false,
              references: {
                model: 'cases',
                key: 'case_id',
              },
            },
          },
          {
            tableName: 'MissedRepossession',
            charset: charset,
          },
        );
      } catch (e) {
        console.log(e);
      }

      try {
        await queryInterface.addColumn('MissedRepossession', 'created_at', {
          type: Sequelize.DATE,
          allowNull: false,
        });

        await queryInterface.addColumn('MissedRepossession', 'updated_at', {
          type: Sequelize.DATE,
          allowNull: false,
        });
      } catch (e) {
        console.log(e);
      }
    });
    return Promise.all(promises).then(() => {
      return queryInterface.sequelize
        .query(
          `
                INSERT INTO MissedRepossession (caseId, missedDate, caseStatus, vin, created_at, updated_at)
                SELECT
                    case_id, close_date, status, vin, NOW(), NOW()
                FROM
                    cases
                WHERE
                  spotted_date IS NOT NULL AND 
                  status IN ('${CASE_STATUSES.pending_close}', '${CASE_STATUSES.closed}') 
          `,
        )
        .then(() => {
          return queryInterface.sequelize.query(`
                INSERT INTO MissedRepossession (caseId, missedDate, caseStatus, vin, created_at, updated_at)
                SELECT
                    case_id, hold_date, status, vin, NOW(), NOW()
                FROM
                    cases
                WHERE
                  spotted_date IS NOT NULL AND 
                  status IN ('${CASE_STATUSES.pending_on_hold}', '${CASE_STATUSES.onHold}')
          `);
        });
    });
  },

  async down(queryInterface, Sequelize) {
    return queryInterface.dropTable('MissedRepossession');
  },
};
