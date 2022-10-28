'use strict';

module.exports = (sequelize, DataTypes) => {
  const RegistrationRequestedCompany = sequelize.define(
    'RegistrationRequestedCompany',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      companyUser: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      contactName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      feedback: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      noOfUsers: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      tableName: 'registration_requested_companies',
      underscored: true,
    },
  );

  RegistrationRequestedCompany.prototype.sanitized = function () {
    return {
      id: this.id,
      companyUser: this.companyUser,
      companyName: this.companyName,
      email: this.email,
      noOfUsers: this.noOfUsers,
      contactName: this.contactName,
      contactNumber: this.contactNumber,
      feedback: this.feedback,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  };

  return RegistrationRequestedCompany;
};
