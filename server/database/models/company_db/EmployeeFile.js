"use strict";

module.exports = (sequelize, DataTypes) => {
  const EmployeeFile = sequelize.define(
    "EmployeeFile",
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
      uploadById: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      fileUrl: {
        type: DataTypes.STRING,
        allowNull: false
      }
    },
    {
      tableName: "employee_files",
      underscored: true
    }
  );

  EmployeeFile.associate = function (models) {
    EmployeeFile.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    EmployeeFile.belongsTo(models.User, {
      as: "uploadBy",
      foreignKey: "uploadById"
    });
  };

  EmployeeFile.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      uploadById: this.uploadById,
      title: this.title,
      fileUrl: this.fileUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return EmployeeFile;
};
