const express = require("express");
const { getUserBalance } = require("../controllers/paymentcontroller");

const router = express.Router();

router.route("/:userId/get_wallet_balance").get(getUserBalance);
module.exports = router;
