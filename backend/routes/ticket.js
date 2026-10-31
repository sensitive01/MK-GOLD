const express = require("express");
const router = express.Router();
const passport = require("passport");
const ticketController = require("../controllers/ticket");
const multer = require("../config/multer");

const upload = multer.ticketUpload || multer.taskUpload || multer;
const auth = passport.authenticate("jwt", { session: false });

router.get("/my-raised", auth, ticketController.findMyRaised);
router.get("/assigned-to-me", auth, ticketController.findAssignedToMe);
router.get("/all", auth, ticketController.findAll);
router.get("/get/:id", auth, ticketController.findById);
router.post("/create", auth, upload.single("proof"), ticketController.create);
router.post("/update-status/:id", auth, ticketController.updateStatus);
router.post("/update/:id", auth, upload.single("proof"), ticketController.update);
router.post("/delete/:id", auth, ticketController.remove);

// Meta helpers
router.get("/meta/designations", auth, ticketController.getDesignations);
router.get("/meta/employees", auth, ticketController.getEmployeesByDesignation);

module.exports = router;

