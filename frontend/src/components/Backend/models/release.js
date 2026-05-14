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
      assignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
      },
      isFinanceCompleted: {
        type: Boolean,
        default: false,
      },
      financePaymentAmount: {
        type: Number,
      },
      financeComments: {
        type: String,
      },
      status: {
        type: String,
        required: true,
        default: "finance pending",
      },
    },
    { timestamps: true }
  )
);

module.exports = Release;
