const socketHelper = require("./socketHepler");

exports.connect = async (socket, data) => {
  try {
    await socketHelper.connect(socket, data);
  } catch (error) {
    console.log("socket error=>", error);
  }
};

exports.disconnect = async socket => {
  try {
    socketHelper.disconnect(socket);
  } catch (error) {
    console.log("socket error=>", error);
  }
};
