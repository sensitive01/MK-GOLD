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
        default: new Date(),
      },
    },
    { timestamps: true }
  )
);

module.exports = Attendance;
