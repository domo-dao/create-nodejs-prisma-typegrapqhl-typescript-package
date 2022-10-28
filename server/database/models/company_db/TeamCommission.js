"use strict";

module.exports = (sequelize, DataTypes) => {
  const TeamCommission = sequelize.define(
    "TeamCommission",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      shiftId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tier: {
        type: DataTypes.TINYINT,
        allowNull: false
      },
      repossessionGoals: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      commissions: {
        type: DataTypes.TEXT,
        allowNull: false
      }
    },
    {
      tableName: "team_commissions",
      underscored: true
    }
  );

  TeamCommission.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftId: this.shiftId,
      tier: this.tier,
      repossessionGoals: JSON.parse(this.repossessionGoals),
      commissions: JSON.parse(this.commissions)
    };
  };

  return TeamCommission;
};
