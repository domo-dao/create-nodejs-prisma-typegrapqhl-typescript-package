"use strict";

const {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_TYPES,
  NOTIFICATION_COLOR,
  NOTIFICATION_STATUSES
} = require("../../../constants/app.constants");
const colorSet = new Set();

colorSet.add(NOTIFICATION_COLOR.default);
colorSet.add(NOTIFICATION_COLOR.RDN_Infraction);
colorSet.add(NOTIFICATION_COLOR.Idle_Infraction);
colorSet.add(NOTIFICATION_COLOR.task_created);
colorSet.add(NOTIFICATION_COLOR.task_read);
colorSet.add(NOTIFICATION_COLOR.task_unread);
colorSet.add(NOTIFICATION_COLOR.task_closed);
colorSet.add(NOTIFICATION_COLOR.task_completed);
colorSet.add(NOTIFICATION_COLOR.task_uncompleted);
colorSet.add(NOTIFICATION_COLOR.task_approved_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_declined_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_proposed_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_cancelled_new_deadline);
colorSet.add(NOTIFICATION_COLOR.task_marked_as_completed);
colorSet.add(NOTIFICATION_COLOR.task_alloted_time_reminder);
colorSet.add(NOTIFICATION_COLOR.shift_end_early);
colorSet.add(NOTIFICATION_COLOR.shift_inactivity);
colorSet.add(NOTIFICATION_COLOR.shift_being_idle);
colorSet.add(NOTIFICATION_COLOR.shift_break_start);
colorSet.add(NOTIFICATION_COLOR.shift_break_over_time);
colorSet.add(NOTIFICATION_COLOR.shift_end_over_time);
colorSet.add(NOTIFICATION_COLOR.shift_failed_checklist);
colorSet.add(NOTIFICATION_COLOR.shift_pause_start);
colorSet.add(NOTIFICATION_COLOR.shift_manual_hot_list);
colorSet.add(NOTIFICATION_COLOR.shift_nearby_spotted_vehicle);
colorSet.add(NOTIFICATION_COLOR.custom_commission_request);

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    "Notification",
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
      notifyForUserId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      category: {
        type: DataTypes.ENUM(
          NOTIFICATION_CATEGORIES.for_user,
          NOTIFICATION_CATEGORIES.for_manager
        ),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          NOTIFICATION_TYPES.task_created,
          NOTIFICATION_TYPES.task_closed,
          NOTIFICATION_TYPES.task_completed,
          NOTIFICATION_TYPES.task_uncompleted,
          NOTIFICATION_TYPES.task_read,
          NOTIFICATION_TYPES.task_unread,
          NOTIFICATION_TYPES.task_approved_new_deadline,
          NOTIFICATION_TYPES.task_declined_new_deadline,
          NOTIFICATION_TYPES.task_proposed_new_deadline,
          NOTIFICATION_TYPES.task_cancelled_new_deadline,
          NOTIFICATION_TYPES.task_marked_as_completed,
          NOTIFICATION_TYPES.task_alloted_time_reminder,
          NOTIFICATION_TYPES.shift_start_later,
          NOTIFICATION_TYPES.shift_end_early,
          NOTIFICATION_TYPES.shift_inactivity,
          NOTIFICATION_TYPES.shift_being_idle,
          NOTIFICATION_TYPES.shift_break_start,
          NOTIFICATION_TYPES.shift_break_over_time,
          NOTIFICATION_TYPES.shift_pause_start,
          NOTIFICATION_TYPES.shift_end_over_time,
          NOTIFICATION_TYPES.shift_failed_checklist,
          NOTIFICATION_TYPES.shift_manual_hot_list,
          NOTIFICATION_TYPES.custom_commission_request,
          NOTIFICATION_TYPES.location_value_invalid
        ),
        allowNull: false
      },
      color: {
        type: DataTypes.ENUM(...colorSet),
        allowNull: false,
        defaultValue: NOTIFICATION_COLOR.default
      },
      text: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      shiftTimeId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM(
          NOTIFICATION_STATUSES.created,
          NOTIFICATION_STATUSES.read
        ),
        allowNull: false,
        defaultValue: NOTIFICATION_STATUSES.created
      }
    },
    {
      tableName: "notifications",
      underscored: true
    }
  );

  Notification.associate = function (models) {
    Notification.belongsTo(models.User, { as: "user", foreignKey: "userId" });
    Notification.belongsTo(models.User, {
      as: "notifyForUser",
      foreignKey: "notifyForUserId"
    });
    Notification.belongsTo(models.ShiftTime, {
      as: "shiftTime",
      foreignKey: "shiftTimeId"
    });
  };

  Notification.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      notifyForUserId: this.notifyForUserId,
      type: this.type,
      color: this.color,
      text: this.text,
      status: this.status,
      shiftTimeId: this.shiftTimeId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return Notification;
};
