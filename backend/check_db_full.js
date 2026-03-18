const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const Attendance = require("./models/attendance");
const FileUpload = require("./models/fileupload");

async function check() {
  const uri = process.env.DB_HOST || "mongodb://127.0.0.1:27017/attica";
  await mongoose.connect(uri);

  const latAttr = await Attendance.findOne().sort({ createdAt: -1 }).exec();
  if (latAttr) {
    const fu = await FileUpload.findOne({ uploadId: latAttr._id }).exec();
    if (fu) {
        console.log("Found File!");
        console.log("uploadId:", fu.uploadId);
        console.log("uploadName:", fu.uploadName);
        console.log("uploadType:", fu.uploadType);
        console.log("uploadedFile:", fu.uploadedFile);
    } else {
        console.log("No file found for latest attendance ID:", latAttr._id);
    }
  }

  await mongoose.disconnect();
}

check();
