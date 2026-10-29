const mongoose = require("mongoose");

const loginLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: false,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
      required: false,
    },
    username: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      default: "",
    },
    userType: {
      type: String,
      default: "",
      index: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
      required: false,
    },
    branchName: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
      index: true,
    },
    userAgent: {
      type: String,
      default: "",
    },
    browser: {
      type: String,
      default: "",
    },
    browserVersion: {
      type: String,
      default: "",
    },
    os: {
      type: String,
      default: "",
    },
    deviceType: {
      type: String,
      default: "Desktop",
    },
    deviceModel: {
      type: String,
      default: "",
    },
    loginMethod: {
      type: String,
      enum: ["password", "otp", "whatsapp_otp"],
      default: "password",
    },
    status: {
      type: String,
      enum: ["success", "failed"],
      default: "success",
      index: true,
    },
    failureReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

loginLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model("loginlogs", loginLogSchema);

