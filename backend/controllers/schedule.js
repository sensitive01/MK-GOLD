const Schedule = require("../models/schedule");

const createSchedule = async (req, res) => {
  try {
    if (req.body.date) {
      const scheduleDate = new Date(req.body.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // start of day
      if (scheduleDate < today) {
        return res.status(400).json({ status: false, message: "Cannot create schedule for past dates" });
      }
    }

    const schedule = await Schedule.create({
      ...req.body,
      createdBy: req.user ? req.user._id : null
    });
    res.status(201).json({ status: true, message: "Schedule created successfully", data: schedule });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ date: 1 }); // Sort by date ascending
    res.status(200).json({ status: true, data: schedules });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findByIdAndDelete(id);
    if (!schedule) {
      return res.status(404).json({ status: false, message: "Schedule not found" });
    }
    res.status(200).json({ status: true, message: "Schedule deleted successfully", data: schedule });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    if (req.body.date) {
      const scheduleDate = new Date(req.body.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // start of day
      if (scheduleDate < today) {
        return res.status(400).json({ status: false, message: "Cannot schedule for past dates" });
      }
    }

    const { id } = req.params;
    const schedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
    if (!schedule) {
      return res.status(404).json({ status: false, message: "Schedule not found" });
    }
    res.status(200).json({ status: true, message: "Schedule updated successfully", data: schedule });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  createSchedule,
  getSchedules,
  deleteSchedule,
  updateSchedule
};
