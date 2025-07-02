module.exports = (app, io) => {
  // REST endpoint
  app.get("/one-on-one", (req, res) => {
    res.json({ message: "OK from server.js" });
  });

  // Custom socket events
  io.on("connection", (socket) => {
    console.log("Custom socket handler from server.js:", socket.id);

    socket.on("custom-event", (data) => {
      console.log("Custom event data:", data);
      socket.emit("custom-reply", { success: true });
    });
  });
};
