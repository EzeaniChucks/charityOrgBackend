const { readFile, unlink } = require("fs");
const Event = require("../schema/eventScheme");
const EventDetail = require("../schema/eventDetails");
const User = require("../schema/userSchema");
const Dispute = require("../schema/disputesSchema");
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
    path.join(__dirname, `../tmp/${req.files.document.name}`),
    (err) => {
      err
        ? res.status(400).json({ msg: "Something went wrong" })
        : readFile(
            path.join(__dirname, `../tmp/${req.files.document.name}`),
            async (err, data) => {
              if (err) res.status(400).json({ msg: "Something went wrong" });
              try {
                const event = await Event.create(JSON.parse(data.toString()));
                if (!event) {
                  return res
                    .status(400)
                    .json({ msg: "Something went wrong. Try again" });
                }

                await EventDetail.create({
                  eventId: event?._id,
                  eventName: event?.eventName,
                });

                event.members.push({
                  userId: event.creatorId,
                  membertype: event.hostStatus.toLowerCase(),
                  isCreator: true,
                });
                await event.save();

                if (req.files.image) {
                  const img = req.files.image;
                  const result = await cloudinary.uploader.upload(
                    img.tempFilePath,
                    {
                      use_filename: true,
                      folder: "charity_events_img",
                    }
                  );
                  event.eventImageName = result.secure_url;
                  await event.save();
                  unlink(req.files.image.tempFilePath, () => {});
                }

                unlink(req.files.document.tempFilePath, () => {
                  return res.status(200).json({ msg: "Success", event });
                });
              } catch (err) {
                return res.status(500).json({ msg: err.message });
              }
            }
          );
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
  const { eventId, userId, name } = req.body;

  if (!eventId || !userId) {
    return res
      .status(400)
      .json({ msg: "event Id and user Id must be present" });
  }

  try {
    const memberExists = await Event.findOne({
      _id: eventId,
      members: { $elemMatch: { userId } },
    });
    if (memberExists) {
      return res.status(400).json({
        msg: "You are already part of this event. Refresh page to see 'Open Event' button",
      });
    }
    const update = await Event.findOneAndUpdate(
      { _id: eventId },
      { $push: { members: { userId, name } } },
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

const leaveEvent = async (req, res) => {
  const { eventId, userId } = req.body;

  if (!eventId || !userId) {
    return res
      .status(400)
      .json({ msg: "event Id and user Id must be present" });
  }

  try {
    const memberExists = await Event.findOne({
      _id: eventId,
      members: { $elemMatch: { userId } },
    });
    const observerExists = await Event.findOne({
      _id: eventId,
      observers: { $elemMatch: { userId } },
    });
    if (!memberExists && !observerExists) {
      return res.status(400).json({
        msg: "You are no longer part of this event. If you wish to be re-added, go to event cover page to join this event",
      });
    }
    const update = await Event.findOneAndUpdate(
      { _id: eventId },
      { $pull: { members: { userId } } },
      { new: true }
    );
    if (!update) {
      return res.status(400).json({ msg: "Something went wrong" });
    }
    return res.status(200).json({ msg: "success. You left this event." });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
const joinEventAsObserver = async (req, res) => {
  const { eventId, userId, name } = req.body;

  if (!eventId || !userId) {
    return res
      .status(400)
      .json({ msg: "event Id and user Id must be present" });
  }

  try {
    const memberExists = await Event.findOne({
      _id: eventId,
      observers: { $elemMatch: { userId } },
    });
    if (memberExists) {
      return res.status(400).json({
        msg: "You are already part of this event. Refresh page to see 'Open Event' button",
      });
    }
    const update = await Event.findOneAndUpdate(
      { _id: eventId },
      { $push: { observers: { userId, name } } },
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
    eventName: detail.eventName,
    memberCategories: detail.memberCategories,
    totalEventAmount: detail.totalEventAmount,
    memberRequests: detail.memberRequests,
    totalMemberRequestsAmount: detail.totalMemberRequestsAmount,
    disputeForms: detail.disputeForms,
    eventPrivacy: event.eventPrivacy,
    completionDeadline: event.completionDeadline,
    depositDeadline: event.depositDeadline,
    eventParticipantNumber: event.members.length,
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
      return res.status(400).json({ msg: "Something went wrong" });
    }

    const event = await Event.findOne({ _id: eventId });
    return res.status(200).json({
      msg: "success",
      memberRequests: eventDet.memberRequests,
      totalMemberRequestsAmount: eventDet.totalMemberRequestsAmount,
      eventParticipantNumber: event.members.length,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

const editMemberRequest = async (req, res) => {
  const { userId, eventId, amount, requestOwnerId, name, description } =
    req.body;

  try {
    const eventExists = await Event.findOne(
      { _id: eventId },
      { observers: { $elemMatch: { userId } } }
    );
    // if (!eventExists) {
    //   return res.status(400).json({ msg: "Unauthorized access" });
    // }

    if (userId !== requestOwnerId && !eventExists) {
      return res.status(400).json({ msg: "Forbidden request" });
    }

    const eventDetail = await EventDetail.findOne({ eventId });
    if (!eventDetail) {
      return res
        .status(400)
        .json({ msg: "Something went wrong. Please try again" });
    }

    //find a single user request object to pull out the user's amount contributed
    const userExists = await EventDetail.findOne(
      { eventId: eventId },
      { memberRequests: { $elemMatch: { userId: requestOwnerId } } }
    );

    //update total amount on main event object
    eventDetail.totalMemberRequestsAmount -=
      userExists.memberRequests[0].amount;
    await eventDetail.save();

    const info = {
      userId: requestOwnerId,
      amount,
      name,
      description,
      date: userExists.memberRequests[0].date,
    };
    const eventDet = await EventDetail.findOneAndUpdate(
      { eventId, "memberRequests.userId": requestOwnerId },
      { $set: { "memberRequests.$": info } },
      { new: true }
    );

    if (!eventDet) {
      return res
        .status(400)
        .json({ msg: "Something went wrong. Please try again" });
    }
    eventDetail.totalMemberRequestsAmount += Number(amount);
    await eventDetail.save();
    return res.status(200).json({
      msg: "success",
      memberRequests: eventDetail.memberRequests,
      totalMemberRequestsAmount: eventDetail.totalMemberRequestsAmount,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
const deleteMemberRequest = async (req, res) => {
  const { userId, eventId, requestOwnerId } = req.body;

  if (userId !== requestOwnerId) {
    return res.status(400).json({ msg: "Forbidden request" });
  }

  try {
    const eventDetail = await EventDetail.findOne({ eventId });
    if (!eventDetail) {
      return res
        .status(400)
        .json({ msg: "Something went wrong. Please try again herre" });
    }

    //find a single user request object to pull out the user's amount contributed
    const userExists = await EventDetail.findOne(
      { eventId: eventId },
      { memberRequests: { $elemMatch: { userId: requestOwnerId } } }
    );

    //update total amount on main event object
    eventDetail.totalMemberRequestsAmount -=
      userExists.memberRequests[0].amount;
    await eventDetail.save();

    const eventDet = await EventDetail.findOneAndUpdate(
      { eventId },
      { $pull: { memberRequests: { userId: requestOwnerId } } },
      { new: true }
    );
    if (!eventDet) {
      return res
        .status(400)
        .json({ msg: "Something went wrong. Please try again2" });
    }
    return res.status(200).json({
      msg: "success",
      memberRequests: eventDetail.memberRequests,
      totalMemberRequestsAmount: eventDetail.totalMemberRequestsAmount,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
const getMembersAndObservers = async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findOne({ _id: eventId });
    if (!event) {
      return res
        .status(400)
        .json({ msg: "Something went wrong. Could not get event" });
    }
    return res.status(200).json({
      msg: "successful",
      members: event.members,
      observers: event.observers,
    });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};
const logDisputeForm = async (req, res) => {
  const {
    disputeLogger,
    description,
    disputedRequests,
    appointedJudge,
    eventId,
  } = req.body;
  if (
    !description ||
    disputedRequests?.length == 0 ||
    !appointedJudge ||
    !disputeLogger
  ) {
    return res.status(400).json({
      msg: "Dispute decription, dispute requests and appointed judge must be present",
    });
  }
  const makeObject = () => {
    let result = {};
    let alphabeth = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ];
    disputedRequests.map((_, i) => {
      return (result[
        `memberRequests.$[${alphabeth[i]}${alphabeth[i]}].disputeFormDescription`
      ] = { userId: disputeLogger, description });
    });
    return result;
  };

  const makeArray = () => {
    let arr = [];

    let alphabeth = [
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ];
    disputedRequests.map((item, i) => {
      let obj = {};
      obj[`${alphabeth[i]}${alphabeth[i]}.userId`] = `${item.userId}`;
      return arr.push(obj);
    });
    return arr;
  };
  // console.log(makeArray());
  try {
    const eventDetail = await EventDetail.findOne({ eventId });
    if (!eventDetail) {
      return res
        .status(200)
        .json({ msg: "Something went wrong. Could not get events" });
    }
    const lodgerExists = await EventDetail.findOne({
      eventId,
      disputeForms: { $elemMatch: { disputeLogger } },
    });
    if (lodgerExists) {
      return res.status(400).json({
        msg: "You already submitted a dispute form to this event. Scroll below to see your form for necessary edits",
      });
    }
    const eventJudgeExists = await Event.findOne({
      _id: eventId,
      observers: { $elemMatch: { userId: appointedJudge.userId } },
    });
    if (!eventJudgeExists) {
      return res
        .status(200)
        .json({ msg: "Something went wrong. Could not get event Judge" });
    }

    const updateJudgeNomination = await Event.findOneAndUpdate(
      {
        _id: eventId,
        "observers.userId": appointedJudge.userId,
      },
      {
        $inc: {
          "observers.$.nominations": 1,
        },
      },
      { new: true }
    );
    if (!updateJudgeNomination) {
      return res.status(200).json({
        msg: "Something went wrong. Could not update Judge's nominations",
      });
    }

    //move dispute description into disputeFormDescription(userId, description) of member requests
    const updateConcernedRequestDisputeDescription =
      await EventDetail.updateOne(
        { eventId },
        { $push: makeObject() },
        { arrayFilters: makeArray(), new: true }
      );
    if (!updateConcernedRequestDisputeDescription) {
      return res.status(400).json({
        msg: "Could not update requests with dispute description field. Please contact customer support",
      });
    }

    const data = {
      disputeLogger,
      description,
      disputedRequests,
      appointedJudge, //{ userId: mongoose.Schema.Types.ObjectId, name: String },
      createdAt: Date.now(),
    };
    eventDetail?.disputeForms?.push(data);
    await eventDetail.save();

    return res
      .status(200)
      .json({ msg: "successful", disputeForms: eventDetail.disputeForms });
  } catch (err) {
    return res.status(500).json({ msg: err.message });
  }
};

module.exports = {
  createEvent,
  fetchAllEvents,
  fetchEventCreatorDetails,
  joinEvent,
  leaveEvent,
  joinEventAsObserver,
  fetchEventDetails,
  acceptEventDeposit,
  addMemberRequest,
  deleteMemberRequest,
  editMemberRequest,
  getmembersRequestList,
  getMembersAndObservers,
  logDisputeForm,
};
