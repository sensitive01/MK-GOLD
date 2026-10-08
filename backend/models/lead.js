const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
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
    preferredLanguage: {
      type: String,
      trim: true,
    },
    weight: {
      type: Number,
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
    documents: [
      {
        documentType: {
          type: String,
        },
        documentFile: {
          type: String,
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "users",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
        attachments: [
          {
            type: String,
          },
        ],
        documents: [
          {
            documentType: String,
            documentFile: String,
          },
        ],
        callbackDate: String,
        callbackTime: String,
      },
    ],
    leadSource: {
      type: String,
      enum: ["admin", "marketing", "telecalling", "telecaller_tl", "telecaller-tl", "branch"],
      default: "admin",
    },
    isExclusive: {
      type: Boolean,
      default: false,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    assignedExecutive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    assignedExecutiveName: {
      type: String,
      trim: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    isMovedToBusiness: {
      type: Boolean,
      default: false,
    },
    movedToBusinessAt: {
      type: Date,
    },
    movedToBusinessBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    tlStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    tlApprovedAt: {
      type: Date,
    },
    tlApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    tlRejectionReason: {
      type: String,
      trim: true,
    },
    isMovedToBullionDesk: {
      type: Boolean,
      default: false,
    },
    bullionStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    bullionApprovedAt: {
      type: Date,
    },
    bullionApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    bullionRejectedAt: {
      type: Date,
    },
    bullionRejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    },
    bullionRejectionReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);
