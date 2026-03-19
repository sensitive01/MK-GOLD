const { storage } = require("./cloudinary");
const multer = require("multer");
module.exports = multer({ storage: storage });
