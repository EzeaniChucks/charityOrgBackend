const path = require("path");
const axios = require("axios");
const request = require("request");
const User = require("../schema/userSchema");
const Wallet = require("../schema/wallet");
const WalletTransaction = require("../schema/wallet_transactions");
const Transaction = require("../schema/transaction");
const Flutterwave = require("flutterwave-node-v3");
//HELPER FUNCTION
const validateUserWallet = async (userId) => {
  try {
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      const newWallet = await Wallet.create({ userId });
      return newWallet;
    }
    return userWallet;
  } catch (err) {
    return res.status(500).json({
      msg: "Something went wrong validating wallet",
      log: err.message,
    });
  }
};

//HELPER FUNCTION
const createWalletTransactions = async (
  userId,
  status,
  currency,
  amount,
  description,
  narration
) => {
  try {
    const walletTransaction = await WalletTransaction.create({
      amount,
      userId,
      isInflow: true,
      status,
      currency,
      description,
      narration,
    });
    return walletTransaction;
  } catch (err) {
    return res.status(500).json({
      msg: "Something went wrong logging wallet transaction. Contact customer care",
      log: err.message,
    });
  }
};

//HELPER FUNCTION
const createTransaction = async (
  userId,
  id,
  status,
  currency,
  amount,
  customer,
  tx_ref,
  description,
  narration
) => {
  try {
    const transaction = Transaction.create({
      userId,
      transactionId: id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone_number,
      amount,
      currency,
      tx_ref,
      paymentStatus: status,
      paymentGateway: "flutterwave",
      description,
      narration,
    });
    return transaction;
  } catch (err) {
    return res.status(500).json({
      msg: "Something went wrong creating transaction. Contact customer care",
      log: err.message,
    });
  }
};

//HELPER FUNCTION
const updateWallet = async (userId, amount) => {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: amount } },
      { new: true }
    );
    return wallet;
  } catch (err) {
    return res.status(500).json({
      msg: "Something went wrong updating wallet. Contact customer care",
      log: err.message,
    });
  }
};

//ENDPOINT
const getCountryBanks = async (req, res) => {
  const { country } = req.params;

  const url = `https://api.flutterwave.com/v3/banks/${country}`;
  try {
    var options = {
      method: "GET",
      url,
      headers: {
        Authorization: `Bearer ${process.env.FLUTTERWAVE_V3_SECRET_KEY}`,
      },
    };
    request(options, function (error, response) {
      if (error) throw new Error(error);
      const resp = JSON.parse(response.body);
      return res.status(200).send({ response: resp });
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

//ENDPOINT
const paymentresponse = async (req, res) => {
  const { transaction_id, description } = req.query;

  const flw = new Flutterwave(
    "FLWPUBK_TEST-31f261f02a971b32bd56cf4deff5e74a-X",
    `${process.env.FLUTTERWAVE_V3_SECRET_KEY}`
  );
  const response = await flw.Transaction.verify({ id: `${transaction_id}` });
  // const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;

  try {
    //query flutterwave to see if transaction took place
    // const response = await axios({
    //   url,
    //   method: "get",
    //   headers: {
    //     "Content-Type": "application/json",
    //     Accept: "application/json",
    //     Authorization: `${process.env.FLUTTERWAVE_V3_SECRET_KEY}`,
    //   },
    // });
    //get relevant data from response
    const { status, currency, id, amount, customer, tx_ref, narration } =
      response.data;

    //Check if transaction Id already exists to avoid topping up wallet with mere frontend page refresh
    const transactionExists = await Transaction.findOne({ transactionId: id });
    if (transactionExists) {
      return res.status(409).json({ msg: "Transaction already exists" });
    }

    const user = await User.findOne({ email: customer.email });
    if (!user) {
      return res.status(409).json({
        msg: "Unathorized Access. Something went wrong. Please contact customer care.",
      });
    }
    await validateUserWallet(user._id);
    await createWalletTransactions(
      user._id,
      status,
      currency,
      amount,
      description,
      narration
    );
    await createTransaction(
      user._id,
      id,
      status,
      currency,
      amount,
      customer,
      tx_ref,
      description,
      narration
    );
    const wallet = await updateWallet(user._id, amount);

    return res
      .status(200)
      .json({ msg: "Wallet funded successfully", balance: wallet.balance });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Something went wrong", log: err.message });
  }
};

//EMDPOINT
const getUserBalance = async (req, res) => {
  try {
    const { userId } = req.params;
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res
        .status(400)
        .json({ msg: "wallet with this user does not exist" });
    }
    return res.status(200).json({ msg: "succesful", balance: wallet.balance });
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Something went wrong", log: err.message });
  }
};
//ENDPOINT
const latestTransactions = async (req, res) => {
  const { userId } = req.body;

  const lastTen = await WalletTransaction.find({ userId })
    .limit(10)
    .sort("-createdAt");

  if (lastTen.length === 0)
    return res.status(400).json({ msg: "Transactions failed to fetched" });
  else
    return res
      .status(200)
      .json({ msg: "success", latestTransactions: lastTen });
};

module.exports = {
  paymentresponse,
  getCountryBanks,
  getUserBalance,
  validateUserWallet,
  latestTransactions,
  createTransaction,
  createWalletTransactions,
};
