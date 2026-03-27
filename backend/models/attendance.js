const mongoose = require("mongoose");

const Attendance = mongoose.model(
  "attendances",
  mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
        required: true,
      },
      attendanceDate: {
        type: Date,
        required: true,
        default: () => new Date(),
      },
      loginTime: {
        type: Date,
        default: () => new Date(),
      },
      logoutTime: {
        type: Date,
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
      },
    },
    { timestamps: true, strict: false }
  )
);

module.exports = Attendance;
