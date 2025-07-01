const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(
  cors({
    origin: "https://aiwoox.in",
    methods: "GET,POST",
    credentials: true,
  })
);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["https://aiwoox.in"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
});

const userSocketMap = {}; // Maps userId -> socket.id
const callReadyMap = {}; // matchId -> Set of userIds

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`User registered: ${userId} => ${socket.id}`);
  });

  socket.on("ready-for-call", ({ userId, matchId }) => {
    if (!callReadyMap[matchId]) callReadyMap[matchId] = new Set();
    callReadyMap[matchId].add(userId);

    if (callReadyMap[matchId].size === 2) {
      callReadyMap[matchId].forEach((uid) => {
        const sid = userSocketMap[uid];
        if (sid) {
          io.to(sid).emit("both-ready");
        }
      });
    }
  });

  socket.on("call-user", ({ to, offer, from }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call", { from, offer });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answered", { answer });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  socket.on("end-call", ({ to }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
  });

  socket.on("disconnect", () => {
    const userId = Object.keys(userSocketMap).find(
      (key) => userSocketMap[key] === socket.id
    );
    if (userId) {
      delete userSocketMap[userId];
      console.log(`User disconnected: ${userId}`);

      // Cleanup callReadyMap entries
      for (const matchId in callReadyMap) {
        callReadyMap[matchId].delete(userId);
        if (callReadyMap[matchId].size === 0) {
          delete callReadyMap[matchId];
        }
      }
    }
  });

  // New: Request call initiation (User1 -> User2)
  socket.on("request-call", ({ from, to }) => {
    console.log(`Call request from ${from} to ${to}`);
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("incoming-call-request", { from });
    }
  });

  // New: Handle response to call request (User2 -> Server)
  socket.on("call-response", ({ from, to, accepted }) => {
    const targetSocketId = userSocketMap[to];
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-response", { from, accepted });
    }
  });
  
});

const PORT = 5050;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
