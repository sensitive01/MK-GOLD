const express = require("express");
const router = express.Router();
const passport = require("passport");

const {
  createSchedule,
  getSchedules,
  deleteSchedule,
  updateSchedule
} = require("../controllers/schedule");

// Add authentication middleware
router.use(function (req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.status(401).json({
        status: false,
        message: err ?? "Unauthorized",
        data: {},
      });
    }

    req.user = user;
    return next();
  })(req, res, next);
});

router.post("/", createSchedule);
router.get("/", getSchedules);
// router.delete("/:id", deleteSchedule);
router.put("/:id", updateSchedule);

module.exports = router;
