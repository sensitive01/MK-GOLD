const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    taskType: {
      type: String,
      trim: true,
      default: "General",
    },
    targetUserTypes: [
      {
        type: String,
      },
    ],
    targetDesignations: [
      {
        type: String,
      },
    ],
    assignedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
      },
    ],
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    deadline: {
      type: Date,
    },
    attachments: [
      {
        name: { type: String },
        url: { type: String, required: true },
        fileType: { type: String },
        size: { type: Number },
      },
    ],
    remarks: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "completed", "cancelled"],
      default: "pending",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    history: [
      {
        status: { type: String },
        remarks: { type: String },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("tasks", taskSchema);
