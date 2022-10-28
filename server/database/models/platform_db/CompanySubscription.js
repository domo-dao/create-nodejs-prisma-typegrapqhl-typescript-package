"use strict";
const Constants = require("../../config/constants");

module.exports = (sequelize, DataTypes) => {
  const CompanySubscription = sequelize.define(
    "CompanySubscription",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      stripeCustomerId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      stripeSubscriptionId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      type: {
        type: DataTypes.ENUM(Object.values(Constants.subscription_types)),
        allowNull: false,
        defaultValue: Constants.subscription_types.basic
      },
      status: {
        type: DataTypes.ENUM(
          Object.values(Constants.company_subscription_status)
        ),
        allowNull: false,
        defaultValue: Constants.company_subscription_status.inactive
      },
      subscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "company_subscription_details",
      underscored: true
    }
  );

  CompanySubscription.prototype.sanitized = function () {
    return {
      id: this.id,
      companyId: this.companyId,
      stripeCustomerId: this.stripeCustomerId,
      stripeSubscriptionId: this.stripeSubscriptionId,
      type: this.type,
      status: this.status,
      subscriptionId: this.subscriptionId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };
  return CompanySubscription;
};
