const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");

const authRouters = require("./routers/authRouters");
const eventRoute = require("./routers/eventRouters");
const WalletRouter = require("./routers/walletRouter");
const uploadImageRouter = require("./routers/uploadImageRouter");
const notifRouter = require("./routers/notificationRouter");
const disputeRoute = require("./routers/disputeRouter");

const fileupload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const app = express();
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://charityorg.vercel.app"],
  },
});

app.set("socketio", io);
app.use(express.json());
app.use(cors());
app.use(fileupload({ useTempFiles: true }));

// app.use((req, _, next) => {
//   req.io = io;
//   next();
// });

app.use("/auth", authRouters);
app.use("/", eventRoute);
app.use("/", uploadImageRouter);
app.use("/", WalletRouter);
app.use("/", notifRouter);
app.use("/", disputeRoute);

let room = "";
let allUsers = [];

if (!("connection" in io.sockets._events)) {
  io.on("connection", function (socket) {
    console.log(`This user ${socket.id} is live from index`);

    socket.on("join_room", function (data) {
      const { username, eventId } = data;
      socket.join(eventId);
      let createdAt = Date.now();

      room = eventId;
      allUsers.push({ id: `${socket.id}`, username, room });
      chatroomUsers = allUsers.filter((user) => user.room === room);

      //send to others in room
      socket.to(room).emit("receive_message", {
        message: `${username} has joined the chat room`,
        username,
        createdAt,
      }); // To all other group users

      socket.to(room).emit("chatroom_users", chatroomUsers); // To all other group users

      //send to room user only
      socket.emit("receive_message", {
        message: `Welcome to the chatroom, ${username}`,
        username,
        createdAt,
      }); //To user alone
      socket.emit("chatroom_users", chatroomUsers); //To user alone
    });

    socket.on("disconnect", function () {
      console.log(`This user ${socket.id} disconnected`);
      socket.to(room).emit("receive_message", {
        message: `Someone has left the chat room`,
        // username,
        // createdAt,
      });
    });
  });
}

const port = 8080 || process.env.port;

const connect = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION);
    console.log("db connected");
    server.listen(port, () => {
      console.log(`server connected to port ${port}`);
    });
  } catch (err) {
    err.message
      ? console.log(err.message)
      : new Error("someting went wrong with db connection");
  }
};

connect();