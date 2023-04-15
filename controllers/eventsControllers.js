const { readFile, unlink } = require("fs");
const Event = require("../schema/eventScheme");
const EventDetail = require("../schema/eventDetails");
const User = require("../schema/userSchema");
const Wallet = require("../schema/wallet");
const {
  createWalletTransactions,
  createTransaction,
  validateUserWallet,
} = require("../controllers/paymentcontroller");
const path = require("path");
const { default: mongoose } = require("mongoose");
const cloudinary = require("cloudinary").v2;

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

        await EventDetail.create({ eventId: event._id });

        event.members.push({
          userId: event.creatorId,
          membertype: event.hostStatus.toLowerCase(),
          isCreator: true,
        });
        await event.save();

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

const fetchAllEvents = async (_, res) => {
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

const fetchEventCreatorDetails = async (req, res) => {
  const { creatorId } = req.params;

  const creator = await User.findOne({
    _id: new mongoose.Types.ObjectId(creatorId),
  });

  if (!creator) {
    return res.status(400).json({ msg: "creator not found" });
  }
  const { _id, firstName, lastName, phoneNumber } = creator;
  return res.status(200).json({
    msg: "success",
    creator: { _id, firstName, lastName, phoneNumber },
  });
};

const joinEvent = async (req, res) => {
  const { eventId, userId } = req.body;
  if (!eventId || !userId) {
    return res
      .status(400)
      .json({ msg: "event Id and user Id must be present" });
  }
  try {
    const memberExists = await Event.findOne({
      _id: eventId,
      members: { $elemMatch: userId },
    });
    if (memberExists) {
      return res.status(400).json({
        msg: "You are already part of this event. Refresh page to see open event button",
      });
    }
    const update = await Event.findOneAndUpdate(
      { _id: eventId },
      { $push: { members: { userId } } },
      { new: true }
    );
    if (!update) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    return res.status(200).json({ msg: "success" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

const fetchEventDetails = async (req, res) => {
  const { eventId } = req.params;
  if (!eventId) {
    return res.status(400).json({
      msg: "Event Id must be present. Please contact customer support",
    });
  }
  const detail = await EventDetail.findOne({ eventId });
  const event = await Event.findOne({ _id: eventId });

  if (!detail || !event) {
    return res.status(400).json({
      msg: "Event detail or event does not seem to exist. Contact customer support",
    });
  }
  const completeDetail = {
    _id: detail._id,
    eventId: detail.eventId,
    memberCategories: detail.memberCategories,
    totalEventAmount: detail.totalEventAmount,
    memberRequests: detail.memberRequests,
    totalMemberRequestsAmount: detail.totalMemberRequestsAmount,
    completionDeadline: event.completionDeadline,
    depositDeadline: event.depositDeadline,
  };
  return res.status(200).json({ msg: "success", eventDetail: completeDetail });
};

const acceptEventDeposit = async (req, res) => {
  const { userId, userName, eventId, depositAmount, categoryDesc, currency } =
    req.body;

  if (Number(depositAmount) <= 0) {
    return res.status(400).json({ msg: "Amount cannot be zero or less" });
  }
  if (!userId || !userName || !depositAmount || !categoryDesc) {
    return res.status(400).json({ msg: "Provide complete credentials" });
  }
  try {
    //check if user has a wallet. if not, autocreate one.
    await validateUserWallet(userId);

    // confirm if wallet has enough funds in wallet
    const wallet = await Wallet.findOne({ userId });
    const walletBalance = Number(wallet.balance);
    if (walletBalance < Number(depositAmount)) {
      return res.status(400).json({
        msg: "Insufficient funds. Kindly fund your wallet or reduce deposit amount",
      });
    }

    //reduce wallet balance by amount
    const newwalletBalance = await Wallet.findOneAndUpdate(
      { userId },
      { $inc: { balance: -Number(depositAmount) } },
      { new: true }
    );
    if (!newwalletBalance) {
      return res.status(400).json({
        msg: "Could not withdraw from wallet. Please refresh page and try again or contact customer support",
      });
    }

    //increase event details by amount
    const titleExists = await EventDetail.findOne({
      eventId,
      memberCategories: {
        $elemMatch: { description: categoryDesc.toLowerCase() },
      },
    });

    if (titleExists) {
      await EventDetail.findOneAndUpdate(
        {
          eventId,
          "memberCategories.description": categoryDesc.toLowerCase(),
        },
        {
          $push: {
            "memberCategories.$.contributors": {
              userId,
              name: userName,
              amount: depositAmount,
              date: Date.now(),
            },
          },
          $inc: {
            "memberCategories.$.totalCategoryAmount": Number(depositAmount),
            totalEventAmount: depositAmount,
          },
        },
        { new: true }
      );
    } else {
      await EventDetail.findOneAndUpdate(
        { eventId },
        {
          $push: {
            memberCategories: {
              description: categoryDesc.toLowerCase(),
              contributors: [
                {
                  userId,
                  name: userName,
                  amount: depositAmount,
                  date: Date.now(),
                },
              ],
              totalCategoryAmount: depositAmount,
            },
          },
          $inc: { totalEventAmount: depositAmount },
        },
        { new: true }
      );
    }

    //create wallet transaction and transaction (type of transfer to ${mainEventName}, as would appear in tx history)
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(400).json({
        msg: "User doesn not exist. This should not normally happen. Please contact customers suport",
      });
    }
    const status = "successful";
    const description = "Event Deposit";
    const narration = "In-app Transaction";
    const tx_ref = `charityapp${Date.now()}${Math.random()}`;
    const customer = {
      email: user.email,
      phone_number: user.phoneNumber,
      name: `${user.firstName} ${user.lastName}`,
    };
    const id = `${Math.random() * 1000}${Date.now()}`;

    await createWalletTransactions(
      userId,
      status,
      currency,
      depositAmount,
      description,
      narration
    );
    await createTransaction(
      userId,
      id,
      status,
      currency,
      depositAmount,
      customer,
      tx_ref,
      description,
      narration
    );

    const eventDetail = await EventDetail.findOne({ eventId });
    const event = await Event.findOne({ _id: eventId });

    if (!eventDetail || !event) {
      return res.status(400).json({
        msg: "Event detail or event does not seem to exist. Contact customer support",
      });
    }

    const completeDetail = {
      _id: eventDetail._id,
      eventId: eventDetail.eventId,
      totalEventAmount: eventDetail.totalEventAmount,
      memberCategories: eventDetail.memberCategories,
      memberRequests: eventDetail.memberRequests,
      totalMemberRequestsAmount: eventDetail.totalMemberRequestsAmount,
      completionDeadline: event.completionDeadline,
      depositDeadline: event.depositDeadline,
    };

    return res.status(200).json({ msg: "success", completeDetail });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const addMemberRequest = async (req, res) => {
  const { userId, name, description, amount, eventId } = req.body;
  try {
    const user = User.findOne({ _id: userId });
    if (!user) {
      return res.status(400).json({ msg: "Unauthorized access" });
    }

    const eventDet = await EventDetail.findOne({ eventId });
    const userExists = await EventDetail.findOne({
      eventId,
      memberRequests: { $elemMatch: { userId } },
    });
    if (userExists) {
      return res.status(400).json({
        msg: "Your request is already queued. Either edit it or delete it and create a new one",
      });
    }
    const info = {
      userId,
      name,
      description,
      amount,
      date: Date.now(),
    };
    eventDet.memberRequests.push(info);
    eventDet.totalMemberRequestsAmount += Number(amount);
    await eventDet.save();
    return res.status(200).json({
      msg: "success",
      memberRequests: eventDet.memberRequests,
      totalMemberRequestsAmount: eventDet.totalMemberRequestsAmount,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const getmembersRequestList = async (req, res) => {
  const { eventId } = req.params;
  try {
    const eventDet = await EventDetail.findOne({ eventId });
    if (!eventDet) {
      res.status(400).json({ msg: "Something went wrong" });
    }
    return res.status(200).json({
      msg: "success",
      memberRequests: eventDet.memberRequests,
      totalMemberRequestsAmount: eventDet.totalMemberRequestsAmount,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
const deleteMemberRequest = async (req, res) => {
  const { userId, eventId } = req.body;
  try {
    const eventMemberAmount = await EventDetail.findOne({ eventId }).select({
      memberRequests: { $elemMatch: { userId } },
    });
    console.log(eventMemberAmount);
    // const eventDet = await EventDetail.findOneAndUpdate(
    //   { eventId },
    //   { $pull: { memberRequests: { userId } } },
    //   { new: true }
    // );

    // res.status(200).json({ msg: "success", eventDet });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const editMemberRequest = async (req, res) => {
  const { userId, eventId, name, description, amount } = req.body;
  const info = {
    userId,
    name,
    description,
    amount,
    date: Date.now(),
  };
  try {
    // const eventDetails = await EventDetail.findOne({eventId, memberRequests:{$elemMatch:{userId}}});
    // if(!eventDetails){
    //   return res.status(400).json({ msg: 'event could not be edited. Try again or contact customer support' });
    // }
    const eventDet = await EventDetail.findOneAndUpdate(
      { eventId, "memberRequests.userId": userId },
      { $set: { "memberRequests.$": info } },
      { new: true }
    );
    return res.status(200).json({ msg: "success", eventDet });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  createEvent,
  fetchAllEvents,
  fetchEventCreatorDetails,
  joinEvent,
  fetchEventDetails,
  acceptEventDeposit,
  addMemberRequest,
  deleteMemberRequest,
  editMemberRequest,
  getmembersRequestList,
};
