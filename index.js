const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const authRouters = require('./routers/authRouters');
require('dotenv').config();


const app = express();

app.use(express.json());
app.use(cors());
app.use('/auth', authRouters)


const port = 8080 || process.env.port

const connect = async ()=>{
    try{
        await mongoose.connect(process.env.DB_CONNECTION);
        // console.log('db connected')
        app.listen(port, ()=>{
            // console.log(`server connected to port ${port}`)
        })
    }catch(err){
        err.message? console.log(err.message): new Error('someting went wrong with db connection')
    }
}

connect();