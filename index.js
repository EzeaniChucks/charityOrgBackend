const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');

const authRouters = require("./routers/authRouters");
const eventRouters = require("./routers/eventRouters");
const WalletRouter = require("./routers/walletRouter");
const uploadImageRouter = require("./routers/uploadImageRouter");

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

app.use("/auth", authRouters);
app.use("/", eventRouters);
app.use("/", uploadImageRouter);
app.use("/", WalletRouter);


const port = 8080 || process.env.port

const connect = async ()=>{
    try{
        await mongoose.connect(process.env.DB_CONNECTION);
        console.log("db connected");
        app.listen(port, () => {
          console.log(`server connected to port ${port}`);
        });
    }catch(err){
        err.message? console.log(err.message): new Error('someting went wrong with db connection')
    }
}

connect();