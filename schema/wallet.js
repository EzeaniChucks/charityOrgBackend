const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  balance: { type: Number, default: 0 },
  userId: { type: mongoose.Schema.Types.ObjectId, required:true, ref:"user"}
},{timestamps:true});

module.exports = mongoose.model("wallet", walletSchema);
