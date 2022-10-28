"use strict";

module.exports = (sequelize, DataTypes) => {
  const InvitationToken = sequelize.define(
    "InvitationToken",
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
      tableName: "invitation_tokens",
      underscored: true
    }
  );

  InvitationToken.associate = function (models) {
    InvitationToken.belongsTo(models.User, {
      as: "user",
      foreignKey: "userId"
    });
  };

  InvitationToken.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      token: this.token
    };
  };

  return InvitationToken;
};
