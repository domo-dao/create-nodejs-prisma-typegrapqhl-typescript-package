'use strict';

const { CHECKLIST_TYPES } = require('../../../constants/app.constants');

module.exports = (sequelize, DataTypes) => {
  const UserChecklist = sequelize.define(
    'UserChecklist',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      adminId: {
        type: DataTypes.INTEGER,
      },
      category: {
        type: DataTypes.ENUM(
          CHECKLIST_TYPES.new_hire,
          CHECKLIST_TYPES.terminate,
          CHECKLIST_TYPES.start_shift,
          CHECKLIST_TYPES.end_shift,
          CHECKLIST_TYPES.activity_tracker,
        ),
        allowNull: false,
      },
      shiftTimeId: {
        type: DataTypes.INTEGER,
      },
      checklist: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      comments: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: 'user_checklist',
      underscored: true,
    },
  );

  UserChecklist.associate = function (models) {
    UserChecklist.belongsTo(models.User, { as: 'user', foreignKey: 'userId' });
    UserChecklist.belongsTo(models.User, {
      as: 'admin',
      foreignKey: 'adminId',
    });
  };

  UserChecklist.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      adminId: this.adminId,
      category: this.category,
      shiftTimeId: this.shiftTimeId,
      checklist: this.checklist,
      comments: this.comments,
    };
  };

  return UserChecklist;
};
