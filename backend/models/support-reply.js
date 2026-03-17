const mongoose = require("mongoose");

const SupportReply = mongoose.Schema(
  {
    support: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "supports",
    },
    from: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("support_reply", SupportReply);
