const fs = require("fs");
const fileUpload = require("../models/fileupload");

async function find(query = {}) {
  try {
    return await fileUpload.find(query).sort({ createdAt: -1 }).exec();
  } catch (err) {
    throw err;
  }
}

async function findOne(query = {}) {
  try {
    return await fileUpload.findOne(query).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await fileUpload.findById(id).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let filePath = `images/files/${Math.floor(10000 + Math.random() * 99999)}-${
      payload.uploadedFile.originalname
    }`;
    fs.writeFileSync(`./public/${filePath}`, payload.uploadedFile.buffer);

    payload.uploadedFile = filePath;
    let fileupload = new fileUpload(payload);
    return await fileupload.save();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    let oldFiles = await fileUpload.find({
      _id: {
        $in: id.split(","),
      },
    });

    oldFiles.forEach((file) => {
      if (file.uploadedFile) {
        fs.unlink(`./public/${file.uploadedFile}`, function (err) {
          // file not deleted
        });
      }
    });

    return await fileUpload
      .deleteMany({
        _id: {
          $in: id.split(","),
        },
      })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function removeMany(query) {
  try {
    let oldFiles = await fileUpload.find(query);

    oldFiles.forEach((file) => {
      if (file.uploadedFile) {
        fs.unlink(`./public/${file.uploadedFile}`, function (err) {
          // fileUpload not deleted
        });
      }
    });

    return await fileUpload.deleteMany(query).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findOne, findById, create, remove, removeMany };
