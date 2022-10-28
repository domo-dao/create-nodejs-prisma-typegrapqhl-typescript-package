'use strict';
const { CASE_STATUSES } = require('../../../rdn/constants');

module.exports = (sequelize, DataTypes) => {
  const MissedRepossession = sequelize.define(
    'MissedRepossession',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      missedDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
      caseStatus: {
        type: DataTypes.ENUM(
          CASE_STATUSES.pending_close,
          CASE_STATUSES.pending_on_hold,
          CASE_STATUSES.closed,
          CASE_STATUSES.onHold,
        ),
        allowNull: false,
      },
      caseId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: 'cases',
          key: 'case_id',
        },
      },
      vin: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'MissedRepossession',
    },
  );

  return MissedRepossession;
};
