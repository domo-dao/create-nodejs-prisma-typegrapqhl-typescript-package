"use strict";

module.exports = (sequelize, DataTypes) => {
  const ClientGoal = sequelize.define(
    "ClientGoal",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      client: {
        type: DataTypes.STRING,
        allowNull: false
      },
      duration: {
        type: DataTypes.ENUM("MTD", "YTD"),
        allowNull: false
      },
      targetRecoveryRate: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      amount: {
        type: DataTypes.FLOAT,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "client_goals",
      underscored: true
    }
  );

  ClientGoal.prototype.sanitized = function () {
    return {
      id: this.id,
      clientId: this.client,
      duration: this.duration,
      targetRecoveryRate: this.targetRecoveryRate,
      amount: this.amount
    };
  };

  return ClientGoal;
};
