"use strict";

module.exports = (sequelize, DataTypes) => {
  const IndividualCommission = sequelize.define(
    "IndividualCommission",
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
      userGroupId: {
        type: DataTypes.INTEGER
      },
      userId: {
        type: DataTypes.INTEGER
      },
      vehicles: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      involuntaryVehicles: {
        type: DataTypes.INTEGER
      },
      amount: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "individual_commissions",
      underscored: true
    }
  );

  IndividualCommission.associate = function (models) {
    IndividualCommission.belongsTo(models.User, {
      as: "user",
      foreignKey: "userId"
    });
    IndividualCommission.belongsTo(models.Role, {
      as: "userGroup",
      foreignKey: "userGroupId"
    });
  };

  IndividualCommission.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftId: this.shiftId,
      userGroupId: this.userGroupId,
      userId: this.userId,
      vehicles: this.vehicles,
      involuntaryVehicles: this.involuntaryVehicles,
      amount: this.amount
    };
  };

  return IndividualCommission;
};
