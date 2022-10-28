"use strict";

module.exports = (sequelize, DataTypes) => {
  const SubBranch = sequelize.define(
    "SubBranch",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      branchId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      rdnBranchId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true
      },
      state: {
        type: DataTypes.STRING,
        allowNull: true
      },
      city: {
        type: DataTypes.STRING,
        allowNull: true
      },
      zipCode: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true
      },
      displayRank: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      zipCodes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      tableName: "sub_branches",
      underscored: true
    }
  );

  SubBranch.associate = function (models) {
    SubBranch.belongsTo(models.Branch, {
      as: "branch",
      foreignKey: "branchId"
    });
  };

  SubBranch.prototype.sanitized = function () {
    return {
      id: this.id,
      branchId: this.branchId,
      rdnBranchId: this.rdnBranchId,
      name: this.name,
      address: this.address,
      state: this.state,
      city: this.city,
      zipCode: this.zipCode,
      phone: this.phone,
      displayRank: this.displayRank,
      zipCodes: this.zipCodes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return SubBranch;
};
