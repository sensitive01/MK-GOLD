const mongoose = require("mongoose");

const Notification = mongoose.model(
  "notifications",
  mongoose.Schema(
    {
      notificationType: {
        type: String,
        required: true,
      },
      notification: {
        type: String,
        required: true,
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
      },
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
      },
      status: {
        type: String,
        required: true,
        default: "active",
      },
      dates: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = Notification;
