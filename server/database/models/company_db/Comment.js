"use strict";

const { COMMENT_TYPES } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    "Comment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type: {
        type: DataTypes.ENUM(
          COMMENT_TYPES.checklist,
          COMMENT_TYPES.manual_hot_case
        ),
        allowNull: false
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      objectId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    },
    {
      tableName: "comments",
      underscored: true
    }
  );

  Comment.prototype.sanitized = function () {
    return {
      id: this.id,
      type: this.type,
      text: this.text,
      objectId: this.objectId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Comment;
};
