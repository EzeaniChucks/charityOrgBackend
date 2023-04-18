const express = require("express");
const {
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
} = require("../controllers/eventsControllers");
const { imageSave } = require("../controllers/imageSaveController");
const router = express.Router();

router.route("/create_event").post(createEvent);
router.route("/upload-image").post(imageSave);
router.route("/get_all_events").get(fetchAllEvents);
router.route("/event_creator_details/:creatorId").get(fetchEventCreatorDetails);
router.route("/join_event").post(joinEvent);
router.route("/:eventId/get_event_details").get(fetchEventDetails);
router.route("/accept_event_deposit").post(acceptEventDeposit);
router.route("/upload_member_request").post(addMemberRequest);
router.route("/delete_member_request").delete(deleteMemberRequest);
router.route("/edit_member_request").put(editMemberRequest);
router.route("/get_member_request_list/:eventId").get(getmembersRequestList);

module.exports = router;
