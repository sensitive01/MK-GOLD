const fileUpload = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await fileUpload.find(req.body ?? {}),
  });
}

async function findOne(req, res) {
  res.json({
    status: true,
    message: "",
    data: await fileUpload.findOne(req.body),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await fileUpload.findById(req.params.id),
  });
}

async function create(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await fileUpload.create({ ...req.body, uploadedFile: req.file }),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function remove(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await fileUpload.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, findOne, create, remove };
