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
  joinEventAsObserver,
  getMembersAndObservers,
  logDisputeForm,
  leaveEvent,
} = require("../controllers/eventsControllers");
const { imageSave } = require("../controllers/imageSaveController");
const router = express.Router();

router.route("/create_event").post(createEvent);
router.route("/upload-image").post(imageSave);
router.route("/get_all_events").get(fetchAllEvents);
router.route("/event_creator_details/:creatorId").get(fetchEventCreatorDetails);
router.route("/join_event").post(joinEvent);
router.route("/leave_event").post(leaveEvent);
router.route("/join_event_as_observer").post(joinEventAsObserver);
router.route("/:eventId/get_event_details").get(fetchEventDetails);
router.route("/accept_event_deposit").post(acceptEventDeposit);
router.route("/upload_member_request").post(addMemberRequest);
router.route("/delete_member_request").delete(deleteMemberRequest);
router.route("/edit_member_request").put(editMemberRequest);
router.route("/get_member_request_list/:eventId").get(getmembersRequestList);
router.route("/get_members_and_obervers/:eventId").get(getMembersAndObservers);
router.route("/log_dispute_form").post(logDisputeForm);

module.exports = router;
