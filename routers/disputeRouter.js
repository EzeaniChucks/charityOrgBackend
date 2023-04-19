const express = require("express");

const {
  add_dispute,
  remove_dispute,
} = require("../controllers/disputesControllers");

const router = express.Router();

router.route("/add_dispute").post(add_dispute);
router.route("/remove_dispute").put(remove_dispute);

module.exports = router;
