"use strict";

module.exports = (sequelize, DataTypes) => {
  const SpotNotifiedAgent = sequelize.define(
    "SpotNotifiedAgent",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      caseId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "spot_notified_agents",
      underscored: true
    }
  );

  SpotNotifiedAgent.associate = function (models) {
    SpotNotifiedAgent.belongsTo(models.Case, {
      as: "spottedVehicle",
      foreignKey: "caseId"
    });
    SpotNotifiedAgent.belongsTo(models.User, {
      as: "agent",
      foreignKey: "userId"
    });
  };

  SpotNotifiedAgent.prototype.sanitized = function () {
    return {
      id: this.id,
      caseId: this.caseId,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return SpotNotifiedAgent;
};
