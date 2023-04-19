const EventDetail = require("../schema/eventDetails");
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
module.exports = {
  add_dispute,
  remove_dispute,
};
