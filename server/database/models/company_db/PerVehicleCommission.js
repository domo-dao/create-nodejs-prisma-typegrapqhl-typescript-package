"use strict";

module.exports = (sequelize, DataTypes) => {
  const PerVehicleCommission = sequelize.define(
    "PerVehicleCommission",
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
      amountForInvoluntary: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      amountForVoluntary: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "per_vehicle_commissions",
      underscored: true
    }
  );

  PerVehicleCommission.associate = function (models) {
    PerVehicleCommission.belongsTo(models.User, {
      as: "user",
      foreignKey: "userId"
    });
    PerVehicleCommission.belongsTo(models.Role, {
      as: "userGroup",
      foreignKey: "userGroupId"
    });
  };

  PerVehicleCommission.prototype.sanitized = function () {
    return {
      id: this.id,
      shiftId: this.shiftId,
      userGroupId: this.userGroupId,
      userId: this.userId,
      amountForInvoluntary: this.amountForInvoluntary,
      amountForVoluntary: this.amountForVoluntary
    };
  };

  return PerVehicleCommission;
};
