const mongoose = require("mongoose");
require("dotenv/config");
const Model = require("../models/designation");

async function check() {
  const uri = process.env.DB_HOST;
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  const newItem = new Model({ name: "Manual-Test", status: "active" });
  await newItem.save();
  console.log("Item saved!");
  const data = await Model.find({}).exec();
  console.log("FOUND DESIGNATIONS:", JSON.stringify(data, null, 2));
  await mongoose.disconnect();
}

check();
