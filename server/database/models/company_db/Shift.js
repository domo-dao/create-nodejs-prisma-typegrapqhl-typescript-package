"use strict";

const moment = require("moment");

module.exports = (sequelize, DataTypes) => {
  const Shift = sequelize.define(
    "Shift",
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
      branchId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      createrId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      startTime: {
        type: DataTypes.STRING,
        allowNull: false,
        get() {
          const startTime = this.getDataValue("startTime");
          if (startTime) {
            const shiftStartTime =
              moment().format("YYYY-MM-DD") + " " + startTime;
            return moment(shiftStartTime).format();
          } else {
            return null;
          }
        },
        set(value) {
          this.setDataValue("startTime", moment(value).format("HH:mm"));
        }
      },
      endTime: {
        type: DataTypes.STRING,
        allowNull: false,
        get() {
          const startTime = this.getDataValue("startTime");
          const endTime = this.getDataValue("endTime");
          if (startTime && endTime) {
            const shiftStartTime =
              moment().format("YYYY-MM-DD") + " " + startTime;
            let shiftEndTime = moment().format("YYYY-MM-DD") + " " + endTime;
            if (
              moment(shiftEndTime).valueOf() < moment(shiftStartTime).valueOf()
            ) {
              shiftEndTime = moment(shiftEndTime).add(1, "days");
            }

            return moment(shiftEndTime).format();
          } else {
            return null;
          }
        },
        set(value) {
          this.setDataValue("endTime", moment(value).format("HH:mm"));
        }
      },
      days: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      peopleWhenFullyStaffed: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userGroups: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      breakTimeBillable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      pauseTimeBillable: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: "shifts",
      underscored: true,
      paranoid: true
    }
  );

  Shift.associate = function (models) {
    Shift.hasMany(models.IndividualCommission, { as: "individualCommission" });
    Shift.hasMany(models.TeamCommission, { as: "teamCommission" });
    Shift.hasMany(models.PerVehicleCommission, { as: "perVehicleCommission" });
    Shift.belongsTo(models.Branch, { as: "branch", foreignKey: "branchId" });
    Shift.belongsTo(models.User, {
      as: "creater",
      foreignKey: "createrId"
    });
  };

  Shift.prototype.sanitized = function () {
    return {
      id: this.id,
      name: this.name,
      createrId: this.createrId,
      branchId: this.branchId,
      startTime: this.startTime,
      endTime: this.endTime,
      days: JSON.parse(this.days),
      peopleWhenFullyStaffed: this.peopleWhenFullyStaffed,
      userGroups: JSON.parse(this.userGroups),
      branch: this.branch,
      breakTimeBillable: this.breakTimeBillable,
      pauseTimeBillable: this.pauseTimeBillable
    };
  };

  return Shift;
};
