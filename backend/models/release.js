const mongoose = require("mongoose");

const Release = mongoose.model(
  "releases",
  mongoose.Schema(
    {
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customers",
        required: true,
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
      pledgeAmount: {
        type: Number,
        required: true,
      },
      payableAmount: {
        type: Number,
        required: true,
      },
      paymentType: {
        type: String,
        required: true,
      },
      bank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customers.bank",
      },
      pledgedDate: {
        type: Date,
        required: true,
      },
      pledgedIn: {
        type: String,
        required: true,
      },
      pledgedBranch: {
        type: String,
        required: true,
      },
      pledgeId: {
        type: String,
      },
      releaseDate: {
        type: Date,
        required: true,
      },
      comments: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
        default: "release pending",
      },
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
      },
      // Bullion Desk Step
      bullionComments: {
        type: String,
      },
      bullionCompleted: {
        type: Boolean,
        default: false,
      },
      bullionCompletedAt: {
        type: Date,
      },
      // Finance Step
      financeAmount: {
        type: Number,
      },
      financeProof: {
        type: String,
      },
      financeComments: {
        type: String,
      },
      financeCompleted: {
        type: Boolean,
        default: false,
      },
      financeCompletedAt: {
        type: Date,
      },
      // Assignee Step
      assigneeAmount: {
        type: Number,
      },
      assigneeProof: {
        type: String,
      },
      assigneeComments: {
        type: String,
      },
      assigneeCompleted: {
        type: Boolean,
        default: false,
      },
      assigneeCompletedAt: {
        type: Date,
      },
      ornaments: [
        {
          ornamentType: { type: String },
          quantity: { type: Number },
          grossWeight: { type: Number },
          netWeight: { type: Number },
          purity: { type: Number },
        },
      ],
      proofDocuments: [
        {
          documentType: { type: String },
          documentNo: { type: String },
          documentFile: { type: String },
        },
      ],
      actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
      },
      actionAt: {
        type: Date,
      },
      actionLog: [
        {
          action: { type: String },
          performedBy: { type: mongoose.Schema.Types.ObjectId },
          performedAt: { type: Date, default: Date.now },
        },
      ],
    },
    { timestamps: true }
  )
);

module.exports = Release;
