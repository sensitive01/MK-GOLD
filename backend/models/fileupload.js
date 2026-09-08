const mongoose = require("mongoose");

const Sales = mongoose.model(
  "fileuploads",
  mongoose.Schema(
    {
      uploadId: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
        required: false,
      },
      uploadName: {
        type: String,
        default: "general",
        required: false,
      },
      uploadType: {
        type: String,
      },
      documentType: {
        type: String,
      },
      documentNo: {
        type: String,
      },
      uploadedFile: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = Sales;
