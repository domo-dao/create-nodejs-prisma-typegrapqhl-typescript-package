'use strict';

module.exports = (sequelize, DataTypes) => {
  const PlatformCompany = sequelize.define(
    'PlatformCompany',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      emailReplyAddress: {
        type: DataTypes.STRING,
      },
      //TODO: Remove this column
      companyDomain: {
        type: DataTypes.STRING,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      dbName: {
        type: DataTypes.STRING,
      },
      dbUsername: {
        type: DataTypes.STRING,
      },
      dbUserPassword: {
        type: DataTypes.STRING,
      },
      uniqueName: {
        type: DataTypes.STRING,
        unique: true,
      },
      awsChecklistBucketName: {
        type: DataTypes.STRING,
      },
      awsProfilePicsBucketName: {
        type: DataTypes.STRING,
      },
      awsEmployementFilesBucketName: {
        type: DataTypes.STRING,
      },
      rdnId: {
        type: DataTypes.STRING,
      },
      rdnKey: {
        type: DataTypes.STRING,
      },
      drnKey: {
        type: DataTypes.STRING,
      },
      syncRdnFrom: {
        type: DataTypes.DATE,
      },
      roleId: {
        type: DataTypes.INTEGER,
      },
      status: {
        type: DataTypes.STRING,
      },
      isRegistrationCompleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isDrnSyncDone: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastImportedRdnEventTimestamp: {
        type: DataTypes.DATE,
      },
      lastOpenDate: {
        type: DataTypes.DATE,
      },
      lastCloseDate: {
        type: DataTypes.DATE,
      },
      lastHoldDate: {
        type: DataTypes.DATE,
      },
      lastRepossessedDate: {
        type: DataTypes.DATE,
      },
      lastScannedAndHitDate: {
        type: DataTypes.DATE,
      },
      approvedDate: {
        type: DataTypes.DATE,
      },
      isBetaTester: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isAlphaTester: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastRDNEventId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
        field: 'lastRDNEventId',
      },
    },
    {
      tableName: 'platform_companies',
      underscored: true,
    },
  );

  PlatformCompany.associate = function (models) {
    PlatformCompany.belongsTo(models.PlatformRole, {
      as: 'role',
      foreignKey: 'roleId',
    });
  };

  PlatformCompany.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      emailReplyAddress: this.emailReplyAddress,
      companyDomain: this.companyDomain,
      password: this.password,
      dbName: this.dbName,
      dbUserPassword: this.dbUserPassword,
      uniqueName: this.uniqueName,
      awsChecklistBucketName: this.awsChecklistBucketName,
      awsProfilePicsBucketName: this.awsProfilePicsBucketName,
      awsEmployementFilesBucketName: this.awsEmployementFilesBucketName,
      lastImportedRdnEventTimestamp: this.lastImportedRdnEventTimestamp,
      lastOpenDate: this.lastOpenDate,
      lastCloseDate: this.lastCloseDate,
      lastHoldDate: this.lastHoldDate,
      lastRepossessedDate: this.lastRepossessedDate,
      lastScannedAndHitDate: this.lastScannedAndHitDate,
      approvedDate: this.approvedDate,
      roleId: this.roleId,
      rdnId: this.rdnId,
      rdnKey: this.rdnKey,
      drnKey: this.drnKey,
      syncRdnFrom: this.syncRdnFrom,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  };

  return PlatformCompany;
};
