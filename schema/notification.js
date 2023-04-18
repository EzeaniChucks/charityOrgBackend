const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    has_checked: { type: Boolean, default: false },
    message: { type: String },
    link: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("notifications", notificationSchema);
