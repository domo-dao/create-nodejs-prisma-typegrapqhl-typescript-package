"use strict";

module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define(
    "Setting",
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
      settingType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      branchId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      value: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: "settings",
      underscored: true
    }
  );

  Setting.associate = function (models) {
    Setting.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    Setting.belongsTo(models.Branch, { as: "branch", foreignKey: "branchId" });
  };

  Setting.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      settingType: this.settingType,
      branchId: this.branchId,
      value: this.value,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Setting;
};
