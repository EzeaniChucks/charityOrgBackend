const express = require("express");
const {
  getUserBalance,
  paymentresponse,
  latestTransactions,
} = require("../controllers/paymentcontroller");

const router = express.Router();

router.route("/:userId/get_wallet_balance").get(getUserBalance);
router.route("/response").get(paymentresponse);
router.route("/latest_transactions").post(latestTransactions);

module.exports = router;
