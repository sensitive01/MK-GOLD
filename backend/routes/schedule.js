const express = require("express");
const router = express.Router();

const {
  createSchedule,
  getSchedules,
  deleteSchedule,
  updateSchedule
} = require("../controllers/schedule");

router.post("/", createSchedule);
router.get("/", getSchedules);
router.delete("/:id", deleteSchedule);
router.put("/:id", updateSchedule);

module.exports = router;
