const supportService = require("../../services/support");
const supportReplyService = require("../../services/support-reply");
const fileUploadService = require("../../services/fileupload");
const mongoose = require("mongoose");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await supportService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await supportService.findById(req.params.id),
  });
}

async function create(req, res) {
  req.body.customer = req.user._id;
  try {
    res.json({
      status: true,
      message: "",
      data: await supportService.create(req.body),
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
      data: await supportService.update(req.params.id, req.body),
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
    const reply = await supportReplyService.find({
      support: {
        $in: req.params.id
          .split(",")
          .map((id) => new mongoose.Types.ObjectId(id)),
      },
    });

    await fileUploadService.removeMany({
      uploadId: {
        $in: reply.map((e) => e._id),
      },
      uploadName: "support_reply",
    });

    await supportReplyService.remove(reply.map((e) => e._id).join(","));

    res.json({
      status: true,
      message: "",
      data: await supportService.remove(req.params.id),
    });
  } catch (err) {
    console.log(err);
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, create, update, remove };
