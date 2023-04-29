const express = require("express");
const {
  getUserBalance,
  paymentresponse,
  latestTransactions,
  getCountryBanks,
} = require("../controllers/paymentcontroller");

const router = express.Router();

router.route("/:userId/get_wallet_balance").get(getUserBalance);
router.route("/response").get(paymentresponse);
router.route("/latest_transactions").post(latestTransactions);
router.route("/fetch_country_banks/:country").get(getCountryBanks);

module.exports = router;
