const apisauce = require("apisauce");
const { drnApiUrl, drnApiKey } = require("../config/vars");

const create = (drnKey = drnApiKey) => {
  const cameraURL = drnApiUrl;

  const cameraHITAPI = apisauce.create({
    baseURL: cameraURL,
    headers: {
      "Content-Type": "text/xml",
      id: drnKey
    },
    // 50 second timeout...
    timeout: 50000
  });

  const getCameraHit = date =>
    cameraHITAPI.get(`/ws_hit_count.php?date=${date}`);

  return {
    getCameraHit
  };
};

module.exports = {
  create
};
