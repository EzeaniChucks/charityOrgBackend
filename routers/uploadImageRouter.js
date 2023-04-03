const express = require("express");
const { imageSave } = require("../controllers/imageSaveController");

const router = express.Router();

router.route("/upload_image").post(imageSave);

module.exports = router;
