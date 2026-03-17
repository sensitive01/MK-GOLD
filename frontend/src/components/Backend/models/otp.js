const mongoose = require("mongoose");

const Attendance = mongoose.model(
  "otp",
  mongoose.Schema(
    {
      phoneNumber: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      otp: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = Attendance;
