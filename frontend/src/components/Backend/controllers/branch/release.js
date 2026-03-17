const release = require("../../services/release");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await release.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await release.findById(req.params.id),
  });
}

async function create(req, res) {
  try {
    let createdData = await release.create(req.body);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "release" },
      },
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function update(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await release.update(req.params.id, req.body),
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
    await fileUploadService.removeMany({
      uploadId: {
        $in: req.params.id.split(","),
      },
      uploadName: "release",
    });
    res.json({
      status: true,
      message: "",
      data: await release.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, create, update, remove };
