"use strict";

module.exports = (sequelize, DataTypes) => {
  const PlatformUser = sequelize.define(
    "PlatformUser",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
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
      status: {
        type: DataTypes.STRING
      }
    },
    {
      tableName: "platform_users",
      underscored: true
    }
  );

  PlatformUser.associate = function (models) {
    PlatformUser.belongsTo(models.PlatformCompany, {
      as: "company",
      foreignKey: "companyId"
    });
  };

  PlatformUser.prototype.sanitized = function () {
    return {
      id: this.id,
      companyId: this.companyId,
      email: this.email,
      rdnId: this.rdnId,
      drnId: this.drnId,
      status: this.status
    };
  };

  return PlatformUser;
};
