const supportReplyService = require("../../services/support-reply");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await supportReplyService.find(req.body ?? {}),
  });
}

async function findBySupportId(req, res) {
  res.json({
    status: true,
    message: "",
    data: await supportReplyService.find({ support: req.params.id }),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await supportReplyService.findById(req.params.id),
  });
}

async function create(req, res) {
  try {
    let createdData = await supportReplyService.create(req.body);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "support_reply" },
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
      data: await supportReplyService.update(req.params.id, req.body),
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
      uploadName: "support_reply",
    });

    res.json({
      status: true,
      message: "",
      data: await supportReplyService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, findBySupportId, create, update, remove };
