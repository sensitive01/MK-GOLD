const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "backend/.env" });

const Attendance = require("./backend/models/attendance");
const FileUpload = require("./backend/models/fileupload");

async function check() {
  await mongoose.connect(process.env.DATABASE);
  console.log("Connected to DB");

  const latestAttendance = await Attendance.find().sort({ createdAt: -1 }).limit(1).exec();
  console.log("Latest Attendance:", JSON.stringify(latestAttendance, null, 2));

  if (latestAttendance.length > 0) {
    const fileUpload = await FileUpload.findOne({ uploadId: latestAttendance[0]._id }).exec();
    console.log("FileUpload linked to this attendance:", JSON.stringify(fileUpload, null, 2));
  }

  const latestFileUpload = await FileUpload.find().sort({ createdAt: -1 }).limit(1).exec();
  console.log("Latest FileUpload (any):", JSON.stringify(latestFileUpload, null, 2));

  await mongoose.disconnect();
}

check();
