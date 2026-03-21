const mongoose = require("mongoose");

const Leave = mongoose.model(
  "leaves",
  mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
        required: true,
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
      },
      leaveType: {
        type: String,
        required: true,
      },
      dates: [Date],
      note: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
        default: "pending",
      },
      bmStatus: {
        type: String,
        default: "pending", // pending, approved, rejected
      },
      hrStatus: {
        type: String,
        default: "pending", // pending, approved, rejected
      },
    },
    { timestamps: true }
  )
);

module.exports = Leave;
