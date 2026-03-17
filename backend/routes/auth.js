var express = require("express");
var router = express.Router();
const passport = require("passport");
const {
  login,
  verifyLoginOtp,
  getUserType,
  getBranchUser,
} = require("../controllers/auth");

router.post("/login", login);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/get-user-type", getUserType);
router.post("/get-branch-user", getBranchUser);

module.exports = router;
