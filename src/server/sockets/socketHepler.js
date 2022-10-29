const httpStatus = require("http-status");
const sessionService = require("../services/session.service");
const errorHandler = require("../utils/errorHandler");

let allConnectedUsers = [];

exports.connect = async (socket, data) => {
  if (!data || (data && !data.token)) return;
  let session;
  try {
    session = await sessionService().getVerifiedTokenSession(data.token);
  } catch (error) {
    errorHandler.handler(error);
  }
  if (!session || (session && !session.user)) {
    const err = {
      success: false,
      error: true,
      message: "Unauthorized",
      status: httpStatus.UNAUTHORIZED
    };
    return err;
  }

  if (session.success !== false) {
    const userSocketData = {
      socketId: socket.id,
      userId: session.user.id,
      user: session.user
    };
    allConnectedUsers.push(userSocketData);
    socket.join(session.user.id);
  }
};

exports.disconnect = socket => {
  try {
    const index = allConnectedUsers.findIndex(
      user => user.socketId === socket.id
    );

    if (index !== -1) {
      const user = allConnectedUsers[index];
      allConnectedUsers.splice(index, 1);
      console.log("After removing user from socket", allConnectedUsers);
      return user;
    }
  } catch (error) {
    console.log("socket error=>", error);
  }
};
