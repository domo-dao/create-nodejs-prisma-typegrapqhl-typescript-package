"use strict";

const { PRODUCT_TOURS } = require("../../../constants/tour.constants");

module.exports = (sequelize, DataTypes) => {
  const CompletedTour = sequelize.define(
    "CompletedTour",
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
      name: {
        type: DataTypes.ENUM(
          PRODUCT_TOURS.activeShifts,
          PRODUCT_TOURS.checklist,
          PRODUCT_TOURS.clientDetails,
          PRODUCT_TOURS.dailyReports,
          PRODUCT_TOURS.overview,
          PRODUCT_TOURS.reports,
          PRODUCT_TOURS.shiftDetails,
          PRODUCT_TOURS.shiftManagement,
          PRODUCT_TOURS.shiftWizard
        ),
        allowNull: false
      }
    },
    {
      tableName: "completed_tours",
      underscored: true
    }
  );

  CompletedTour.associate = function (models) {
    CompletedTour.belongsTo(models.User, { as: "user", foreignKey: "userId" });
  };

  CompletedTour.prototype.sanitized = function () {
    return {
      id: this.id,
      userId: this.userId,
      tourId: this.tourId
    };
  };

  return CompletedTour;
};
