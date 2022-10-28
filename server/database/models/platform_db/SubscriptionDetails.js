"use strict";
const Constants = require("../../config/constants");

module.exports = (sequelize, DataTypes) => {
  const SubscriptionDetails = sequelize.define(
    "SubscriptionDetails",
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
      price: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      allowedUsers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // 0 means unlimited
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      description: {
        type: DataTypes.STRING,
        allowNull: false
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      stripeProductId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      stripePriceId: {
        type: DataTypes.STRING,
        allowNull: false
      },
      type: {
        type: DataTypes.ENUM(Object.values(Constants.subscription_types)),
        allowNull: false,
        defaultValue: Constants.subscription_types.basic
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
      tableName: "subscription_details",
      underscored: true
    }
  );

  SubscriptionDetails.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
      price: this.price,
      allowedUsers: this.allowedUsers,
      duration: this.duration,
      description: this.description,
      isActive: this.isActive,
      stripeProductId: this.stripeProductId,
      stripePriceId: this.stripePriceId,
      type: this.type,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  };

  return SubscriptionDetails;
};

/*
Db structure
| Name            | Type         | Allow Null | Default  | Description                                  |
|-----------------|--------------|------------|----------|----------------------------------------------|
| id              | INTEGER      | NO         | NULL     | PRIMARY KEY                                  |
| name            | VARCHAR(255) | NO         | NULL     | Name of the subscription                     |
| price           | INTEGER      | NO         | NULL     | Price of the subscription                    |
| allowedUsers    | INTEGER      | NO         | 0        | Number of users allowed in the subscription  |
| duration        | INTEGER      | NO         | 30       | Duration of the subscription in days         |
| description     | VARCHAR(255) | NO         | NULL     | Description of the subscription              |
| isActive        | BOOLEAN      | NO         | true     | Is the subscription active                   |
| stripeProductId | VARCHAR(255) | NO         | NULL     | Stripe product id                            |
| stripePriceId   | VARCHAR(255) | NO         | NULL     | Stripe price id                              |
| type            | ENUM         | NO         | advance  | Type of the subscription                     |
| createdAt       | DATETIME     | NO         | NOW      | Created at                                   |
| updatedAt       | DATETIME     | NO         | NOW      | Updated at                                   |
 */
