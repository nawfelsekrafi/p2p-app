const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const rooms = {};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("join-room", (room) => {
    if (!rooms[room]) {
      rooms[room] = { users: {} };
    }

    rooms[room].users[socket.id] = socket.id;
    socket.join(room);

    // Broadcast to all users in the room when a new user joins
    io.to(room).emit("user-connected", socket.id);

    socket.on("disconnect", () => {
      // Remove the user when they disconnect
      delete rooms[room].users[socket.id];

      // Broadcast to all users in the room when a user disconnects
      io.to(room).emit("user-disconnected", socket.id);
    });

    socket.on("offer", (offer, targetSocketId) => {
      io.to(targetSocketId).emit("offer", offer, socket.id);
    });

    socket.on("answer", (answer, targetSocketId) => {
      io.to(targetSocketId).emit("answer", answer);
    });

    socket.on("ice-candidate", (candidate, targetSocketId) => {
      io.to(targetSocketId).emit("ice-candidate", candidate);
    });
  });
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
