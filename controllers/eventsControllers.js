const { readFile, unlink } = require("fs");
const Event = require("../schema/eventScheme");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// const imageSave = async (req, res) => {
//
// };

const createEvent = async (req, res) => {
  req.files.document.mv(
    path.join(__dirname, `../tmp/${req.files.document.name}`)
  );
  readFile(
    path.join(__dirname, `../tmp/${req.files.document.name}`),
    async (err, data) => {
      if (err) console.log(err);
      try {
        const event = await Event.create(JSON.parse(data.toString()));

        if (!event) {
          return res
            .status(400)
            .json({ msg: "Something went wrong. Try again" });
        }

        if (req.files.image) {
          const img = req.files.image;
          const result = await cloudinary.uploader.upload(img.tempFilePath, {
            use_filename: true,
            folder: "charity_events_img",
          });
          event.eventImageName = result.secure_url;
          await event.save();
          unlink(req.files.image.tempFilePath, () => {});
        }

        unlink(req.files.document.tempFilePath, () => {});
        return res.status(200).json({ msg: "Success", event });
      } catch (err) {
        return res.status(500).json({ msg: err.message });
      }
    }
  );
};

const fetchAllEvents = async (req, res) => {
  try {
    const allEvents = await Event.find({});
    if (!allEvents) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    return res.status(200).json({ msg: "Success", allEvents });
  } catch (err) {
    res.status(500).json(err.message);
  }
};
module.exports = {
  createEvent,
  fetchAllEvents,
};
