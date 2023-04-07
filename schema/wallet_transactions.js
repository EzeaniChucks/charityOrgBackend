const mongoose = require("mongoose");

const walletTransactionSchema = new mongoose.Schema(
  {
    amount: { type: Number, default: 0 },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    isInflow:{type:Boolean, default:false},
    paymentMethod:{type:String, default:'flutterwave'},
    currency:{
        type:String,
        required:[true, "currency is required"],
        enum:['NGN', 'USD', 'EUR', 'GBP']
    },
    status:{
        type:String,
        required:[true,"payment status is required"],
        enum:['successful', 'pending', 'failed']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("walletTransaction", walletTransactionSchema);