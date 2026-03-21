const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    targetUserType: [String],
    notificationType: {
      type: String,
      enum: ["pop", "scroll"],
      default: "scroll",
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    expiryDate: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        default: [],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Announcement", announcementSchema);
