// module.exports = (app, io) => {
//   // Track connected users and active calls
//   const users = new Map(); // socketId -> { userId, name }
//   const activeCalls = new Map(); // callId -> call data

//   // REST endpoint
//   app.get("/one-on-one", (req, res) => {
//     res.json({ message: "OK from server.js" });
//   });

//   // Socket.IO connection handler
//   io.on("connection", (socket) => {
//     console.log(`New connection established - Socket ID: ${socket.id}`);

//     // When a user identifies themselves with their Supabase ID
//     socket.on("register-user", ({ userId, userName }) => {
//       users.set(socket.id, { userId, userName });
//       console.log(
//         `Registration attempt - UserID: ${userId}, SocketID: ${socket.id}`
//       );
//       if (!userId || !userName) {
//         console.error("Invalid registration: Missing userId or userName");
//         return;
//       }
//       users.set(socket.id, { userId, userName });
//       console.log(
//         `User registered - Name: ${userName}, ID: ${userId}, Socket: ${socket.id}`
//       );
//       console.log(`Current users:`, Array.from(users.values()));


//       // Notify the user they're connected
//       socket.emit("registration-successful");
//     });

//     // Handle call initiation (Harvey calls Mick)
//     socket.on("initiate-call", ({ callerId, receiverId, callId }) => {
//         console.log(
//           `Call initiation - CallID: ${callId}, Caller: ${callerId}, Receiver: ${receiverId}`
//         );
//       const callerData = users.get(socket.id);
//       if (!callerData) {
//         console.error(`Caller not found in registry - SocketID: ${socket.id}`);
//         return socket.emit("call-failed", { reason: "Caller not registered" });
//       }

//       console.log(`Finding receiver - Looking for UserID: ${receiverId}`);
//       // Find receiver's socket (Mick)
//       const receiverEntry = [...users.entries()].find(
//         ([_, userData]) => userData.userId === receiverId
//       );

//       if (receiverEntry) {
//         const [receiverSocketId, receiverData] = receiverEntry;
//         console.log(
//           `Receiver found - Name: ${receiverData.userName}, SocketID: ${receiverSocketId}`
//         );
//         // Store call information
//         activeCalls.set(callId, {
//           callerSocketId: socket.id,
//           receiverSocketId,
//           status: "ringing",
//         });

//         // Notify receiver
//         console.log(`Emitting incoming-call to SocketID: ${receiverSocketId}`);
//         io.to(receiverSocketId).emit("incoming-call", {
//           callId,
//           callerId,
//           callerName: callerData.userName,
//         });

//         // Acknowledge to caller
//         console.log(`Call initiated successfully - CallID: ${callId}`);
//         socket.emit("call-initiated", { callId });
//       } else {
//         console.error(`Receiver not found - UserID: ${receiverId}`);
//         console.log(`Currently connected users:`, Array.from(users.values()));
//         socket.emit("call-failed", { reason: "User not available" });
//       }
//     });

//     // Handle call acceptance (Mick accepts Harvey's call)
//     socket.on("accept-call", ({ callId }) => {
//       const callData = activeCalls.get(callId);
//       if (!callData || callData.receiverSocketId !== socket.id) return;

//       // Update call status
//       callData.status = "active";
//       activeCalls.set(callId, callData);

//       // Notify both parties
//       io.to(callData.callerSocketId).emit("call-accepted", { callId });
//     });

//     // Handle call rejection
//     socket.on("reject-call", ({ callId }) => {
//       const callData = activeCalls.get(callId);
//       if (!callData) return;

//       // Notify caller
//       io.to(callData.callerSocketId).emit("call-rejected", { callId });

//       // Clean up
//       activeCalls.delete(callId);
//     });

//     // Handle WebRTC signaling (offer, answer, ICE candidates)
//     socket.on("webrtc-signal", ({ callId, signal }) => {
//       const callData = activeCalls.get(callId);
//       if (!callData) return;

//       // Determine who to forward the signal to
//       const targetSocketId =
//         socket.id === callData.callerSocketId
//           ? callData.receiverSocketId
//           : callData.callerSocketId;

//       io.to(targetSocketId).emit("webrtc-signal", { callId, signal });
//     });

//     // Handle call termination
//     socket.on("end-call", ({ callId }) => {
//       const callData = activeCalls.get(callId);
//       if (!callData) return;

//       // Notify the other participant
//       const otherSocketId =
//         socket.id === callData.callerSocketId
//           ? callData.receiverSocketId
//           : callData.callerSocketId;

//       io.to(otherSocketId).emit("call-ended", { callId });

//       // Clean up
//       activeCalls.delete(callId);
//     });

//     // Handle disconnection
//     socket.on("disconnect", () => {
//       const userData = users.get(socket.id);
//       if (!userData) return;

//       console.log(`User disconnected: ${userData.userName}`);
//       users.delete(socket.id);

//       // End any active calls this user was part of
//       for (const [callId, callData] of activeCalls) {
//         if (
//           callData.callerSocketId === socket.id ||
//           callData.receiverSocketId === socket.id
//         ) {
//           const otherSocketId =
//             callData.callerSocketId === socket.id
//               ? callData.receiverSocketId
//               : callData.callerSocketId;

//           io.to(otherSocketId).emit("call-ended", { callId });
//           activeCalls.delete(callId);
//         }
//       }
//     });
//   });
// };
