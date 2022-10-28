'use strict';
const { DISPOSITION_STATUS, CASE_RECORD_STATUS } = require('../../../constants/app.constants');

module.exports = (sequelize, DataTypes) => {
  const Case = sequelize.define(
    'Case',
    {
      caseId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      status: {
        type: DataTypes.STRING,
      },
      orderDate: {
        type: DataTypes.DATE,
      },
      orderType: {
        type: DataTypes.STRING,
      },
      spottedDate: {
        type: DataTypes.DATE,
      },
      spottedNote: {
        type: DataTypes.STRING,
      },
      spottedAddress: {
        type: DataTypes.STRING,
      },
      spottedLat: {
        type: DataTypes.DOUBLE,
      },
      spottedLng: {
        type: DataTypes.DOUBLE,
      },
      spotterId: {
        type: DataTypes.INTEGER,
      },
      repoDate: {
        type: DataTypes.DATE,
      },
      rdnRepoDate: {
        type: DataTypes.DATE,
      },
      repoAddress: {
        type: DataTypes.STRING,
      },
      repoLat: {
        type: DataTypes.DOUBLE,
      },
      repoLng: {
        type: DataTypes.DOUBLE,
      },
      repoAgentRdnId: {
        type: DataTypes.STRING,
      },
      repoAgentFirstName: {
        type: DataTypes.STRING,
      },
      repoAgentLastName: {
        type: DataTypes.STRING,
      },
      closeDate: {
        type: DataTypes.DATE,
      },
      holdDate: {
        type: DataTypes.DATE,
      },
      vendorId: {
        type: DataTypes.STRING,
      },
      vendorName: {
        type: DataTypes.STRING,
      },
      vendorAddress: {
        type: DataTypes.STRING,
      },
      vendorCity: {
        type: DataTypes.STRING,
      },
      vendorState: {
        type: DataTypes.STRING,
      },
      vendorZipCode: {
        type: DataTypes.STRING,
      },
      vendorPhone: {
        type: DataTypes.STRING,
      },
      vendorFax: {
        type: DataTypes.STRING,
      },
      vendorBranchName: {
        type: DataTypes.STRING,
      },
      lenderClientId: {
        type: DataTypes.STRING,
      },
      lenderClientName: {
        type: DataTypes.STRING,
      },
      lenderPhone: {
        type: DataTypes.STRING,
      },
      lenderType: {
        type: DataTypes.STRING,
      },
      lienholderClientId: {
        type: DataTypes.STRING,
      },
      lienholderClientName: {
        type: DataTypes.STRING,
      },
      vin: {
        type: DataTypes.STRING,
      },
      yearMakeModel: {
        type: DataTypes.STRING,
      },
      vehicleColor: {
        type: DataTypes.STRING,
      },
      vehicleLicenseNumber: {
        type: DataTypes.STRING,
      },
      vehicleLicenseState: {
        type: DataTypes.STRING,
      },
      investigator: {
        type: DataTypes.STRING,
      },
      assigneeId: {
        type: DataTypes.STRING,
      },
      assigneeName: {
        type: DataTypes.STRING,
      },
      orderWorkerId: {
        type: DataTypes.STRING,
      },
      caseRefNum: {
        type: DataTypes.STRING,
      },
      accountNum: {
        type: DataTypes.STRING,
      },
      spottedBranchId: {
        type: DataTypes.INTEGER,
      },
      repossessedBranchName: {
        type: DataTypes.STRING,
      },
      disposition: {
        type: DataTypes.ENUM(Object.values(DISPOSITION_STATUS)),
      },
      storedStartDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      storedEndDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      originalRepossessionDateTime: {
        type: DataTypes.DATE,
        field: 'originalRepossessionDateTime',
      },
      recordStatus: {
        type: DataTypes.ENUM(Object.values(CASE_RECORD_STATUS)),
        defaultValue: CASE_RECORD_STATUS.PROCESSED,
        allowNull: false,
        field: 'recordStatus',
      },
      shouldUpdate: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
        field: 'shouldUpdate',
      },
      errorMessage: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'errorMessage',
      },
      originalOrderDate: {
        type: DataTypes.DATEONLY,
        field: 'originalOrderDate',
      },
      originalCloseDate: {
        type: DataTypes.DATEONLY,
        field: 'originalCloseDate',
      },
      originalHoldDate: {
        type: DataTypes.DATEONLY,
        field: 'originalHoldDate',
      },
      vendorBranchId: {
        type: DataTypes.INTEGER,
        field: 'vendorBranchId',
      },
      spottedVendorBranchId: {
        type: DataTypes.INTEGER,
        field: 'spottedVendorBranchId',
      },
      repoZipCode: {
        type: DataTypes.STRING,
        field: 'repoZipCode',
      },
      spottedZipCode: {
        type: DataTypes.STRING,
        field: 'spottedZipCode',
      },
    },
    {
      tableName: 'cases',
      underscored: true,
    },
  );

  Case.associate = function (models) {
    Case.belongsTo(models.User, { as: 'user', foreignKey: 'spotterId' });
  };

  Case.prototype.sanitized = function () {
    return {
      caseId: this.caseId,
      status: this.status,
      orderDate: this.orderDate,
      orderType: this.orderType,
      spottedDate: this.spottedDate,
      spottedNote: this.spottedNote,
      spottedAddress: this.spottedAddress,
      spottedLat: this.spottedLat,
      spottedLng: this.spottedLng,
      spotterId: this.spotterId,
      repoDate: this.repoDate,
      rdnRepoDate: this.rdnRepoDate,
      repoAddress: this.repoAddress,
      repoLat: this.repoLat,
      repoLng: this.repoLng,
      repoAgentRdnId: this.repoAgentRdnId,
      repoAgentFirstName: this.repoAgentFirstName,
      repoAgentLastName: this.repoAgentLastName,
      closeDate: this.closeDate,
      holdDate: this.holdDate,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      vendorAddress: this.vendorAddress,
      vendorCity: this.vendorCity,
      vendorState: this.vendorState,
      vendorZipCode: this.vendorZipCode,
      vendorPhone: this.vendorPhone,
      vendorFax: this.vendorFax,
      vendorBranchName: this.vendorBranchName,
      lenderClientId: this.lenderClientId,
      lenderClientName: this.lenderClientName,
      lenderPhone: this.lenderPhone,
      lenderType: this.lenderType,
      lienholderClientId: this.lienholderClientId,
      lienholderClientName: this.lienholderClientName,
      vin: this.vin,
      yearMakeModel: this.yearMakeModel,
      vehicleColor: this.vehicleColor,
      vehicleLicenseNumber: this.vehicleLicenseNumber,
      vehicleLicenseState: this.vehicleLicenseState,
      investigator: this.investigator,
      assigneeId: this.assigneeId,
      assigneeName: this.assigneeName,
      orderWorkerId: this.orderWorkerId,
      caseRefNum: this.caseRefNum,
      accountNum: this.accountNum,
      spottedBranchId: this.spottedBranchId,
      repossessedBranchName: this.repossessedBranchName,
      disposition: this.disposition,
      storedStartDate: this.storedStartDate,
      storedEndDate: this.storedEndDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      originalRepossessionDateTime: this.originalRepossessionDateTime,
      vendorBranchId: this.vendorBranchId,
      spottedVendorBranchId: this.spottedVendorBranchId,
      repoZipCode: this.repoZipCode,
      spottedZipCode: this.spottedZipCode,
    };
  };

  return Case;
};
