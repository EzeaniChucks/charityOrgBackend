const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, required: true, unique: true },
  password: {
    type: String,
    required: true,
  },
  dateOfBirth: {
    type: Date,
    required: true,
  },
  phoneNumber: {
    type: Number,
    required: true,
  },
  promoCode: {
    type: String,
  },
  cardNumber: Number,
  expirationDate: Date,
  cvv: Number,
  accountBank: String,
  accountNumber: String,
  verificationToken: String,
  isVerified: { type: Boolean, default: false },
  verified: Date,
});

module.exports = mongoose.model('CharityAppUsers', userSchema);