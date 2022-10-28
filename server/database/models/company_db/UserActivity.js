'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserActivity = sequelize.define(
    'UserActivity',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      caseId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updateId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      updateNote: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updatedType: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      targetUserId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      shiftTimeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      shiftId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      updateTime: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'user_activities',
      underscored: true,
      indexes: [
        {
          fields: ['user_id', 'count', 'name'],
        },
      ],
    },
  );

  UserActivity.associate = function (models) {
    UserActivity.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    UserActivity.belongsTo(models.User, {
      as: 'targetUser',
      foreignKey: 'targetUserId',
    });
    UserActivity.belongsTo(models.Shift, {
      as: 'shift',
      foreignKey: 'shiftId',
    });
    UserActivity.belongsTo(models.ShiftTime, {
      as: 'shiftTime',
      foreignKey: 'shiftTimeId',
    });
  };

  UserActivity.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      shiftId: this.shiftId,
      shiftTimeId: this.shiftTimeId,
      caseId: this.caseId,
      updateId: this.updateId,
      updatedType: this.updatedType,
      updateNote: this.updateNote,
      type: this.type,
      targetUserId: this.targetUserId,
      updateTime: this.updateTime,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  };

  return UserActivity;
};
