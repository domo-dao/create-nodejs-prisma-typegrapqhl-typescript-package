"use strict";

module.exports = (sequelize, DataTypes) => {
  const BibleUser = sequelize.define(
    "BibleUser",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      shippingAddress: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "bible_users",
      underscored: true
    }
  );

  BibleUser.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      shippingAddress: this.shippingAddress,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return BibleUser;
};
