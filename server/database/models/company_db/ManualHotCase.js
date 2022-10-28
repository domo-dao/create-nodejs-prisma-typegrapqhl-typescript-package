"use strict";

module.exports = (sequelize, DataTypes) => {
  const ManualHotCase = sequelize.define(
    "ManualHotCase",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      caseId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      lenderClientName: {
        type: DataTypes.STRING
      },
      vin: {
        type: DataTypes.STRING
      },
      yearMakeModel: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: "manual_hot_cases",
      underscored: true
    }
  );

  ManualHotCase.prototype.sanitized = function () {
    return {
      id: this.id,
      caseId: this.caseId,
      lenderClientName: this.lenderClientName,
      vin: this.vin,
      yearMakeModel: this.yearMakeModel,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return ManualHotCase;
};
