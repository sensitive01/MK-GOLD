const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/admin/notificationManagement");
const passport = require("passport");
const multer = require("../config/multer");

// Client routes (available to any authenticated user)
router.get(
  "/my",
  passport.authenticate("jwt", { session: false }),
  notificationController.getMyNotifications
);

router.post(
  "/seen/:id",
  passport.authenticate("jwt", { session: false }),
  notificationController.markAsSeen
);

// Admin / Management endpoints
router.get(
  "/get",
  passport.authenticate("jwt", { session: false }),
  notificationController.find
);

router.post(
  "/get",
  passport.authenticate("jwt", { session: false }),
  notificationController.find
);

router.get(
  "/get/:id",
  passport.authenticate("jwt", { session: false }),
  notificationController.findById
);

router.post(
  "/create",
  passport.authenticate("jwt", { session: false }),
  multer.single("uploadedFile"),
  notificationController.create
);

router.post(
  "/update/:id",
  passport.authenticate("jwt", { session: false }),
  multer.single("uploadedFile"),
  notificationController.update
);

router.post(
  "/delete/:id",
  passport.authenticate("jwt", { session: false }),
  notificationController.remove
);

module.exports = router;

