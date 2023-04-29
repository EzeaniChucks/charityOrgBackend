const EventDetail = require("../schema/eventDetails");
const Event = require("../schema/eventScheme");
const Dispute = require("../schema/disputesSchema");
const { default: mongoose } = require("mongoose");

const add_dispute = async (req, res) => {
  const {
    requestId,
    requestOwnerId,
    dispute_complainerId,
    eventId,
    description,
  } = req.body;

  try {
    const userExists = await EventDetail.findOne(
      { eventId: eventId },
      { memberRequests: { $elemMatch: { userId: requestOwnerId } } }
    );

    const exists =
      userExists.memberRequests[0].disputes.includes(dispute_complainerId);

    if (exists) {
      return res.status(400).json({
        msg: "You already logged a dispute to this request. Await user action or contact them inbox",
      });
    }
    const eventDet = await EventDetail.findOneAndUpdate(
      { eventId, "memberRequests._id": requestId },
      { $push: { "memberRequests.$.disputes": dispute_complainerId } },
      { new: true }
    );

    if (!eventDet) {
      return res.status(400).json({ msg: "Something went wrong" });
    }

    const dispute = await Dispute.create({
      requestId,
      requestOwnerId,
      dispute_complainerId,
      eventId,
      description,
    });
    if (!dispute) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    return res.status(200).json({ msg: "Dispute logged" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const remove_dispute = async (req, res) => {
  const { requestId, requestOwnerId, dispute_complainerId, eventId } = req.body;

  try {
    const eventUpdate = await EventDetail.findOneAndUpdate(
      { eventId, "memberRequests._id": requestId },
      { $pull: { "memberRequests.$.disputes": dispute_complainerId } },
      { new: true }
    );
    if (!eventUpdate) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    await Dispute.findOneAndDelete({ eventId, requestOwnerId, requestId });
    return res.status(200).json({ msg: "Dispute removed" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const remove_all_disputes = async (req, res) => {
  const { eventId, requestId, userId } = req.body;

  // console.log(eventId, requestId, userId);
  //pull out event and check if user is a judge
  try {
    const eventExists = await Event.findOne(
      { _id: eventId },
      { observers: { $elemMatch: { userId } } }
    );
    if (!eventExists) {
      return res.status(400).json({ msg: "Unauthorized access" });
    }

    //turn dispute array of selected requestform to empty
    const edited = await EventDetail.findOneAndUpdate(
      { eventId, "memberRequests._id": requestId },
      { "memberRequests.$.disputes": [] },
      { new: true }
    );
    // console.log(edited);
    if (!edited) {
      return res
        .status(400)
        .json({ msg: "No request disputes available to delete" });
    }

    //remove all concerned disputes regarding that request from dispute model
    const hasDeleted = await Dispute.deleteMany({ requestId });
    if (!hasDeleted) {
      return res
        .status(400)
        .json({ msg: "No request disputes availble to delete" });
    }

    return res.status(200).json({ msg: "All disputes have been removed" });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
module.exports = {
  add_dispute,
  remove_dispute,
  remove_all_disputes,
};
