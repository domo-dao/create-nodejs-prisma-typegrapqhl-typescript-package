"use strict";

const { TASK_STATUSES } = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const TaskAction = sequelize.define(
    "TaskAction",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      taskId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          TASK_STATUSES.open,
          TASK_STATUSES.closed,
          TASK_STATUSES.completed,
          TASK_STATUSES.new_deadline_proposed,
          TASK_STATUSES.new_deadline_approved,
          TASK_STATUSES.new_deadline_cancelled,
          TASK_STATUSES.new_deadline_declined,
          TASK_STATUSES.marked_as_completed,
          TASK_STATUSES.uncompleted,
          TASK_STATUSES.acknowledged_uncompleted
        ),
        allowNull: false
      },
      newCompletionDate: {
        type: DataTypes.DATE
      },
      note: {
        type: DataTypes.TEXT
      },
      reason: {
        type: DataTypes.TEXT
      }
    },
    {
      tableName: "task_actions",
      underscored: true
    }
  );

  TaskAction.prototype.sanitized = function () {
    return {
      id: this.id,
      type: this.type,
      completionDate: this.completionDate,
      note: this.note,
      reason: this.reason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return TaskAction;
};
