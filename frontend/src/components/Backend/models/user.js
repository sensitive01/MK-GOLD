const mongoose = require("mongoose");

const User = mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "employees",
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
    },
    userType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "active",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("users", User);
