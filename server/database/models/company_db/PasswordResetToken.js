"use strict";

module.exports = (sequelize, DataTypes) => {
  const PasswordResetToken = sequelize.define(
    "PasswordResetToken",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "password_reset_tokens",
      underscored: true
    }
  );

  PasswordResetToken.associate = function (models) {
    PasswordResetToken.belongsTo(models.User, {
      as: "user",
      foreignKey: "userId"
    });
  };

  PasswordResetToken.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      token: this.token,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return PasswordResetToken;
};
