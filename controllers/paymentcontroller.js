const path = require("path");
const axios = require("axios");
const User = require("../schema/userSchema");
const Wallet = require("../schema/wallet");
const WalletTransaction = require("../schema/wallet_transactions");
const Transaction = require("../schema/transaction");

//HELPER FUNCTION
const validateUserWallet = async (userId) => {
  console.log(userId);
  try {
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      const newWallet = await Wallet.create({ userId });
      return newWallet;
    }
    return userWallet;
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Something went wrong", log: err.message });
  }
};

//HELPER FUNCTION
const createWalletTransactions = async (userId, status, currency, amount) => {
  try {
    const walletTransaction = await WalletTransaction.create({
      amount,
      userId,
      isInflow: true,
      status,
      currency,
    });
    return walletTransaction;
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Something went wrong", log: err.message });
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
  tx_ref
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
    });
    return transaction;
  } catch (err) {
    return res
      .status(500)
      .json({ msg: "Something went wrong", log: err.message });
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
    return res
      .status(500)
      .json({ msg: "Something went wrong", log: err.message });
  }
};

//ENDPOINT
const paymentresponse = async (req, res) => {
  const { transaction_id } = req.query;

  const url = `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`;
  try {
    //query flutterwave to see if transaction took place
    const response = await axios({
      url,
      method: "get",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `${process.env.FLUTTERWAVE_V3_SECRET_KEY}`,
      },
    });
    //get relevant data from response
    const { status, currency, id, amount, customer, tx_ref } =
      response.data.data;

    //Check if transact. Id already exists to avoid topping up wallet with mere frontend page refresh
    const transactionExists = await Transaction.findOne({ transactionId: id });
    if (transactionExists) {
      return res.status(409).json({ msg: "Transaction already exists" });
    }

    const user = await User.findOne({ email: customer.email });
    await validateUserWallet(user._id);
    await createWalletTransactions(user._id, status, currency, amount);
    await createTransaction(
      user._id,
      id,
      status,
      currency,
      amount,
      customer,
      tx_ref
    );
    const wallet = await updateWallet(user._id, amount);

    return res.status(200).json({ msg: "Wallet funded successfully", wallet });
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
module.exports = {
  paymentresponse,
  getUserBalance,
  validateUserWallet,
};
