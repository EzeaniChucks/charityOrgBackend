const express = require("express");

const {
  add_dispute,
  remove_dispute,
  remove_all_disputes,
} = require("../controllers/disputesControllers");

const router = express.Router();

router.route("/add_dispute").post(add_dispute);
router.route("/remove_dispute").put(remove_dispute);
router.route("/remove_all_disputes").delete(remove_all_disputes);

module.exports = router;
