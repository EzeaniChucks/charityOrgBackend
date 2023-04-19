const mongoose = require("mongoose");

const eventDetailsSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, "event ID must be provided"],
  },
  eventName: { type: String },
  memberCategories: [
    {
      description: String,
      contributors: [
        {
          userId: mongoose.Schema.Types.ObjectId,
          name: String,
          amount: { type: Number, default: 0 },
          date: Date,
        },
      ],
      totalCategoryAmount: { type: Number, default: 0 },
    },
  ],
  totalEventAmount: { type: Number, default: 0 },
  memberRequests: [
    {
      userId: mongoose.Schema.Types.ObjectId,
      name: String,
      description: { type: String, required: true },
      amount: { type: Number, default: 0, required: true },
      disputes: Array,
      date: Date,
    },
  ],
  totalMemberRequestsAmount: { type: Number, default: 0 },
});

module.exports = new mongoose.model("eventDetails", eventDetailsSchema);
