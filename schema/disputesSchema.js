const mongoose = require("mongoose");

const disputesSchema = new mongoose.Schema(
  {
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    requestOwnerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    dispute_complainerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "user",
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "events",
    },
    description: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("disputes", disputesSchema);
