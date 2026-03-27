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
      actionLog: [
        {
          action: { type: String }, // requested, bm_approved, bm_rejected, hr_approved, hr_rejected, approved, rejected
          performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
          performedByName: { type: String },
          role: { type: String }, // admin, branch, hr, accounts
          performedAt: { type: Date, default: Date.now },
        },
      ],
    },
    { timestamps: true }
  )
);

module.exports = Leave;
