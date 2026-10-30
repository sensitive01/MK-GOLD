const mongoose = require("mongoose");

const notificationManagementSchema = new mongoose.Schema(
  {
    notificationType: {
      type: String,
      enum: ["scroll", "popup"],
      required: true,
      default: "scroll",
    },
    // For Scroll (Marquee):
    content: {
      type: String,
      default: "",
    },
    scrollSpeed: {
      type: String,
      enum: ["slow", "normal", "fast"],
      default: "normal",
    },
    themeColor: {
      type: String,
      enum: ["primary", "gold", "error", "warning", "info", "dark"],
      default: "primary",
    },

    // For Pop-up:
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    image: {
      type: String,
      default: "",
    },
    actionText: {
      type: String,
      default: "Got it",
    },
    actionUrl: {
      type: String,
      default: "",
    },

    // Target Audience & Timing:
    targetRoles: [
      {
        type: String,
      },
    ],
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
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

module.exports = mongoose.model(
  "NotificationManagement",
  notificationManagementSchema
);

