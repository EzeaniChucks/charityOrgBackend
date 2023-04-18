const express = require("express");

const {
  log_notification,
  get_notification,
  mark_as_checked,
} = require("../controllers/notificationControllers");

const router = express.Router();

router.route("/get_notifications/:userId").get(get_notification);
router.route("/log_notification").post(log_notification);
router.route("/mark_message_as_read").post(mark_as_checked);

module.exports = router;
