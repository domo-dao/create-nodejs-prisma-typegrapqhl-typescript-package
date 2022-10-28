"use strict";

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: DataTypes.STRING
      },
      lastName: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      rdnId: {
        type: DataTypes.STRING
      },
      drnId: {
        type: DataTypes.STRING
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phoneNumber: {
        type: DataTypes.STRING
      },
      avatarUrl: {
        type: DataTypes.STRING
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      teamId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      branchId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      hourlyRate: {
        type: DataTypes.DOUBLE
      },
      hireDate: {
        type: DataTypes.DATE
      },
      status: {
        type: DataTypes.STRING
      },
      isPasswordChangeRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      }
    },
    {
      tableName: "users",
      underscored: true
    }
  );

  User.associate = function (models) {
    User.belongsTo(models.Role, { as: "role", foreignKey: "roleId" });
    User.belongsTo(models.Branch, { as: "branch", foreignKey: "branchId" });
  };

  User.prototype.sanitized = function () {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      rdnId: this.rdnId,
      drnId: this.drnId,
      phoneNumber: this.phoneNumber,
      isPasswordChangeRequired: this.isPasswordChangeRequired,
      avatarUrl: this.avatarUrl,
      roleId: this.roleId,
      teamId: this.teamId,
      branchId: this.branchId,
      role: this.role,
      branch: this.branch,
      hourlyRate: this.hourlyRate,
      hireDate: this.hireDate,
      status: this.status
    };
  };

  return User;
};
