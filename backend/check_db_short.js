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
    console.log("Attendance ID:", latAttr._id);
    const fu = await FileUpload.findOne({ uploadId: latAttr._id }).exec();
    if (fu) {
        console.log("Linked FileUpload ID:", fu._id);
        console.log("File Path:", fu.uploadedFile);
    } else {
        console.log("No FileUpload linked to this attendance!");
    }
  } else {
    console.log("No Attendance records found.");
  }

  await mongoose.disconnect();
}

check();
