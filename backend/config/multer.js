const { storage, taskStorage, ticketStorage } = require("./cloudinary");
const multer = require("multer");

const defaultUpload = multer({ storage: storage });
defaultUpload.taskUpload = multer({ storage: taskStorage });
defaultUpload.ticketUpload = multer({ storage: ticketStorage || storage });

module.exports = defaultUpload;

