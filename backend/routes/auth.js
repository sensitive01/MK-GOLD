var express = require("express");
var router = express.Router();
const passport = require("passport");
const {
  login,
  verifyLoginOtp,
  getUserType,
  getBranchUser,
  getProfile,
  updateProfile,
} = require("../controllers/auth");

router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/get-user-type", getUserType);
router.post("/get-branch-user", getBranchUser);
router.get("/profile", passport.authenticate("jwt", { session: false }), getProfile);
router.post("/profile", passport.authenticate("jwt", { session: false }), updateProfile);

module.exports = router;
