const socketio = require("socket.io");
const events = require("./events");
const handlers = require("./handlers");
const errorHandler = require("../utils/errorHandler");

const io = socketio();
io.on("connection", socket => {
  socket.on(events.FRONTEND_REQUEST_CONNECTION, async data => {
    try {
      await handlers.connect(socket, data);
    } catch (error) {
      errorHandler.handler(error);
    }
  });
  socket.on(events.FRONTEND_DISCONNECT, () => {
    handlers.disconnect(socket);
  });
});
module.exports = io;
