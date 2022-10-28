const { isEmpty } = require("lodash");

const getDeviceDetails = async (filterData, dbName) => {
  const companyService = require("./company.service");
  const { Device } = await companyService().getCompanyDatabase(dbName);
  const device = await Device.findOne({
    where: {
      ...filterData
    }
  });
  return device;
};

const saveDeviceDetails = async (userId, deviceData, dbName) => {
  const companyService = require("./company.service");
  const { Device } = await companyService().getCompanyDatabase(dbName);
  const device = await getDeviceDetails({ userId }, dbName);
  if (!device) {
    await Device.create({
      userId,
      ...deviceData
    });
  } else {
    if (
      !isEmpty(deviceData.buildNumber) &&
      deviceData.buildNumber !== device.buildNumber
    )
      device.buildNumber = deviceData.buildNumber;
    if (
      !isEmpty(deviceData.deviceVersion) &&
      deviceData.deviceVersion !== device.deviceVersion
    )
      device.deviceVersion = deviceData.deviceVersion;
    if (
      !isEmpty(deviceData.deviceOs) &&
      deviceData.deviceOs !== device.deviceOs
    )
      device.deviceOs = deviceData.deviceOs;
    await device.save();
  }
};

module.exports = {
  getDeviceDetails,
  saveDeviceDetails
};
