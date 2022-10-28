'use strict';

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define(
    'Branch',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      displayRank: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'display_rank',
      },
    },
    {
      tableName: 'branches',
      underscored: true,
    },
  );

  Branch.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
    };
  };

  return Branch;
};
