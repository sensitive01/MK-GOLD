const mongoose = require("mongoose");

mongoose.connect(process.env.DB_HOST, function (err) {
  if (err) {
    console.log(err.message);
  } else {
    console.log("Connected to MongoDB");
  }
});
