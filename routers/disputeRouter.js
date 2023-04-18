const express = require("express");

const { add_dispute } = require("../controllers/disputesControllers");

const router = express.Router();

router.route("/add_dispute").get(add_dispute);

module.exports = router;
