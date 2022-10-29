const { PlatformSetting } = require("../database/models");

const platformService = () => {
  const getAllPlatformSettings = async () => {
    const settings = await PlatformSetting.findAll();

    return settings;
  };

  const getPlatformSetting = async key => {
    const setting = await PlatformSetting.findOne({
      where: { key },
      raw: true
    });

    if (setting) return setting.value;

    return null;
  };

  const setPlatformSetting = async (key, value) => {
    const setting = await getPlatformSetting(key);

    if (!setting) {
      await PlatformSetting.create({ key, value });
    } else {
      await PlatformSetting.update({ value }, { where: { key } });
    }

    return true;
  };

  return {
    getAllPlatformSettings,
    getPlatformSetting,
    setPlatformSetting
  };
};

module.exports = platformService;
