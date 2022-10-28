"use strict";

const {
  TASK_STATUSES,
  TASK_URGENCIES
} = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    "Task",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      assignerId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      assigneeId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      details: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      urgency: {
        type: DataTypes.ENUM(
          TASK_URGENCIES.high,
          TASK_URGENCIES.medium,
          TASK_URGENCIES.low
        ),
        allowNull: false
      },
      completionDate: {
        type: DataTypes.DATE,
        allowNull: false
      },
      status: {
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
      readStatus: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      completedAt: {
        type: DataTypes.DATE
      }
    },
    {
      tableName: "tasks",
      underscored: true
    }
  );

  Task.associate = function (models) {
    Task.belongsTo(models.User, { as: "assignee", foreignKey: "assigneeId" });
    Task.belongsTo(models.User, { as: "assigner", foreignKey: "assignerId" });
    Task.hasOne(models.TaskAction, { as: "action", foreignKey: "taskId" });
  };

  Task.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
      details: this.details,
      urgency: this.urgency,
      completionDate: this.completionDate,
      status: this.status,
      readStatus: this.readStatus,
      completedAt: this.completedAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Task;
};
