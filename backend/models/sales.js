const mongoose = require("mongoose");

const Sales = mongoose.model(
  "sales",
  mongoose.Schema(
    {
      billId: {
        type: String,
        unique: true,
        required: true,
      },
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
        required: true,
      },
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
      saleType: {
        type: String,
        required: true,
      },
      purchaseType: {
        type: String,
        required: true,
      },
      release: [
        {
          type: mongoose.Schema.Types.Mixed,
        },
      ],
      ornaments: [
        mongoose.Schema(
          {
            ornamentType: {
              type: String,
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
            },
            grossWeight: {
              type: Number,
              required: true,
            },
            stoneWeight: {
              type: Number,
              required: true,
            },
            netWeight: {
              type: Number,
              required: true,
            },
            purity: {
              type: Number,
              required: true,
            },
            netAmount: {
              type: Number,
              required: true,
            },
            status: {
              type: String,
              required: true,
              default: "hold",
            },
            movedAt: {
              type: Date,
            },
          },
          { timestamps: true }
        ),
      ],
      dop: {
        type: String,
        required: true,
      },
      goldRate: {
        type: Number,
      },
      silverRate: {
        type: Number,
      },
      netWeight: {
        type: Number,
        required: true,
      },
      netAmount: {
        type: Number,
        required: true,
      },
      paymentType: {
        type: String,
        required: true,
      },
      margin: {
        type: Number,
        required: true,
      },
      payableAmount: {
        type: Number,
        required: true,
      },
      cashAmount: {
        type: Number,
      },
      bank: {
        type: mongoose.Schema.Types.ObjectId,
      },
      bankAmount: {
        type: Number,
      },
      status: {
        type: String,
        required: true,
        default: "bullion pending",
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
      // Fund Transfer Step (After Admin Approval)
      fundTransferAmount: {
        type: Number,
      },
      fundTransferProof: {
        type: String,
      },
      fundTransferComments: {
        type: String,
      },
      fundTransferCompleted: {
        type: Boolean,
        default: false,
      },
      fundTransferCompletedAt: {
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
          comments: { type: String },
        },
      ],
      timeline: [
        {
          event: { type: String },
          performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "employees" },
          performedAt: { type: Date, default: Date.now },
          details: { type: String },
          timeTaken: { type: Number }, // in seconds
        },
      ],
    },
    { timestamps: true }
  )
);

module.exports = Sales;
