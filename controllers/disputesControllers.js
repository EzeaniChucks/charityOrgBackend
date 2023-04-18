const EventDetail = require("../schema/eventDetails");
const Dispute = require("../schema/disputesSchema");

const add_dispute = async (req, res) => {
  const {
    requestId,
    requestOwnerId,
    dispute_complainerId,
    eventId,
    description,
  } = req.body;

  try {
    const eventDet = EventDetail.findOne({ eventId });
    if (!eventDet) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    eventDet.disputes.add(dispute_complainerId);
    await eventDet.save();

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

module.exports = {
  add_dispute,
};
