const notification = require("../schema/notification");
const Event = require("../schema/eventScheme");
const mongoose = require("mongoose");

const buildGroupNotificationArray = ({
  memberArray,
  message,
  link,
  userId,
}) => {
  return memberArray.reduce((total, item) => {
    if (item?.userId.toString() === userId) return total;
    const data = {
      recipientId: item.userId,
      message,
      link,
    };
    total.push(data);
    return total;
  }, []);
};

const log_notification = async (req, res) => {
  const { message, userId, link, eventId } = req.body;
  //if a user does something, get all the members of that event. Attach their Ids as recicipientIds
  //to each notification. P0pulate notification server at once with this data.
  try {
    const event = await Event.findOne({ _id: eventId });
    //blocking code below
    const array = buildGroupNotificationArray({
      memberArray: event.members,
      message,
      link,
      userId,
    });
    // console.log(array)

    //end of blocking code
    const notifs = await notification.create(array);
    if (!notifs) {
      return res
        .status(400)
        .json({ msg: "Something went wrong logging notification" });
    }
    return res.status(200).json({ msg: "success. Notification logged" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const get_notification = async (req, res) => {
  const { userId } = req.params;
  try {
    const notifs = await notification.find({ recipientId: userId });
    if (!notifs) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    return res.status(200).json({ msg: "success", notifs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const mark_as_checked = async (req, res) => {
  const { messageId, userId } = req.body;
  try {
    const notif = await notification.findOne({
      _id: messageId,
      recipientId: userId,
    });
    if (!notif) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    notif.has_checked = true;
    await notif.save();

    const notifs = await notification.find({ recipientId: userId });
    return res.status(200).json({ msg: "success", notifs });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
module.exports = { get_notification, log_notification, mark_as_checked };
