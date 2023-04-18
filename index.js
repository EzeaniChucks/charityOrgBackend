const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
const cors = require("cors");

const authRouters = require("./routers/authRouters");
const eventRouters = require("./routers/eventRouters");
const WalletRouter = require("./routers/walletRouter");
const uploadImageRouter = require("./routers/uploadImageRouter");
const notifRouter = require("./routers/notificationRouter");

const fileupload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const app = express();

app.use(express.json());
app.use(cors());
app.use(fileupload({ useTempFiles: true }));

const port = 8080 || process.env.port;

const connect = async () => {
  try {
    await mongoose.connect(process.env.DB_CONNECTION);
    console.log("db connected");
    const httpServer = http.createServer(app);
    let server = httpServer.listen(port, () => {
      console.log(`server connected to port ${port}`);
    });
    let io = require("socket.io")(server, {
      cors: {
        origin: ["http://localhost:3000", "https://charityorg.vercel.app"],
      },
    });
    app.use((req, _, next) => {
      req.io = io;
      next();
    });
    app.use("/auth", authRouters);
    app.use("/", eventRouters);
    app.use("/", uploadImageRouter);
    app.use("/", WalletRouter);
    app.use("/", notifRouter);
  } catch (err) {
    err.message
      ? console.log(err.message)
      : new Error("someting went wrong with db connection");
  }
};

connect();