const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    mobile: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    place: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    remarks: {
      type: String,
      trim: true,
    },
    pincode: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "branches",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    category: {
      type: String,
      enum: ["gold", "silver"],
      default: "gold",
    },
    weight: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: "gm",
    },
    type: {
      type: String,
      enum: ["physical", "pledged"],
      default: "physical",
    },
    releaseAmount: {
      type: Number,
      default: 0,
    },
    pledgedAmount: {
      type: Number,
      default: 0,
    },
    attachment: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "converted", "rejected"],
      default: "pending",
    },
    dispositions: [
      {
        status: String,
        remark: String,
        branch: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "branches",
        },
        createdBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
        attachment: {
          type: String,
        },
        callbackDate: String,
        callbackTime: String,
      },
    ],
    leadSource: {
      type: String,
      enum: ["admin", "marketing", "telecalling", "branch"],
      default: "admin",
    },
    isExclusive: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
