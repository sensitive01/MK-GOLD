const mongoose = require("mongoose");

const Expense = mongoose.model(
  "expenses",
  mongoose.Schema(
    {
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
        required: false,
      },
      amount: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      otherTypeName: {
        type: String,
      },
      note: {
        type: String,
        default: "",
      },
      status: {
        type: String,
        default: "pending",
      },
      // Fuel specific fields
      openingRead: {
        type: Number,
      },
      closingRead: {
        type: Number,
      },
      overallRead: {
        type: Number,
      },
      openingProof: {
        type: String,
      },
      closingProof: {
        type: String,
      },
      proof: {
        type: String,
      },
      // Sales Incentive specific fields
      bill: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sales",
      },
      billId: {
        type: String,
      },
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
      },
      // Workflow / Audit tracking
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      creatorRole: {
        type: String,
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
      },
      approvedRole: {
        type: String,
      },
      approvedAt: {
        type: Date,
      },
      rejectionReason: {
        type: String,
      },
      attachments: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "fileuploads",
        },
      ],
    },
    { timestamps: true }
  )
);

module.exports = Expense;
