"use strict";

const { CHECKLIST_TYPES } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const Checklist = sequelize.define(
    "Checklist",
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
      category: {
        type: DataTypes.ENUM(
          CHECKLIST_TYPES.new_hire,
          CHECKLIST_TYPES.terminate,
          CHECKLIST_TYPES.start_shift,
          CHECKLIST_TYPES.end_shift,
          CHECKLIST_TYPES.activity_tracker,
          CHECKLIST_TYPES.motion_tracker
        ),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM("yesno", "text", "file"),
        allowNull: false
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      photo: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      input: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      tableName: "checklist",
      underscored: true
    }
  );

  Checklist.associate = function (models) {
    Checklist.belongsTo(models.Role, { as: "role", foreignKey: "roleId" });
  };

  Checklist.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
      category: this.category,
      roleId: this.roleId,
      photo: this.photo,
      input: this.input
    };
  };

  return Checklist;
};
