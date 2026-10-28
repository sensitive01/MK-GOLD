const { storage, taskStorage } = require("./cloudinary");
const multer = require("multer");

const defaultUpload = multer({ storage: storage });
defaultUpload.taskUpload = multer({ storage: taskStorage });

module.exports = defaultUpload;

