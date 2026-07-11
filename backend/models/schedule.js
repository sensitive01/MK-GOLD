const mongoose = require("mongoose");

const ScheduleSchema = mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  mediaUrl: { type: String },
  date: { type: Date, required: true }, // Store as Date for easier querying
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // optional reference to who created it
}, { timestamps: true });

module.exports = mongoose.model("schedule", ScheduleSchema);
