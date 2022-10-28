"use strict";

const {
  SHIFT_FEED_CATEGORIES,
  SHIFT_FEED_TYPES,
  EMAIL_MAPS
} = require("../../../constants/app.constants");

module.exports = (sequelize, DataTypes) => {
  const ShiftFeed = sequelize.define(
    "ShiftFeed",
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
      objectId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      category: {
        type: DataTypes.ENUM(
          SHIFT_FEED_CATEGORIES.alert,
          SHIFT_FEED_CATEGORIES.infraction,
          SHIFT_FEED_CATEGORIES.commission,
          SHIFT_FEED_CATEGORIES.failed_checklist,
          SHIFT_FEED_CATEGORIES.manual_hot_list
        ),
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(
          SHIFT_FEED_TYPES.shift_start_later,
          SHIFT_FEED_TYPES.shift_end_early,
          SHIFT_FEED_TYPES.shift_inactivity,
          SHIFT_FEED_TYPES.shift_being_idle,
          SHIFT_FEED_TYPES.shift_being_offline,
          SHIFT_FEED_TYPES.shift_being_idle_offline,
          SHIFT_FEED_TYPES.shift_break_start,
          SHIFT_FEED_TYPES.shift_break_over_time,
          SHIFT_FEED_TYPES.shift_pause_start,
          SHIFT_FEED_TYPES.shift_failed_checklist,
          SHIFT_FEED_TYPES.shift_manual_hot_list,
          SHIFT_FEED_TYPES.custom_commission_request,
          SHIFT_FEED_TYPES.location_value_invalid
        ),
        allowNull: false
      },
      expiryDate: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reason: {
        type: DataTypes.STRING,
        allowNull: true
      },
      mapImage: {
        type: DataTypes.TEXT,
        defaultValue: EMAIL_MAPS.default_image
      }
    },
    {
      tableName: "shift_feed",
      underscored: true
    }
  );

  ShiftFeed.associate = function (models) {
    ShiftFeed.belongsTo(models.User, { as: "user", foreignKey: "userId" });
  };

  ShiftFeed.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      objectId: this.objectId,
      category: this.category,
      type: this.type,
      expiryDate: this.expiryDate,
      reason: this.reason,
      mapImage: this.mapImage,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return ShiftFeed;
};
