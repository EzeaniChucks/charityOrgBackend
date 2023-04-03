const express = require("express");
const {
  createEvent,
  fetchAllEvents,
} = require("../controllers/eventsControllers");
const { imageSave } = require("../controllers/imageSaveController");
const router = express.Router();

router.route("/create_event").post(createEvent);
router.route("/upload-image").post(imageSave);
router.route("/get_all_events").get(fetchAllEvents);

module.exports = router;
