const leadService = require("../../services/lead");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  try {
    const data = await leadService.find(req.body ?? {}, req.user);
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findById(req, res) {
  try {
    const data = await leadService.findById(req.params.id);
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function create(req, res) {
  try {
    if (req.user) {
      req.body.branch = req.user.branch?._id || req.user.branch;
      req.body.createdBy = req.user._id;
    }
    const createdData = await leadService.create(req.body);
    res.json({
      status: true,
      message: "Lead created successfully!",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "lead" },
      },
    });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function update(req, res) {
  try {
    const data = await leadService.update(req.params.id, req.body);
    res.json({ status: true, message: "Lead updated successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    await fileUploadService.removeMany({
      uploadId: { $in: req.params.id.split(",") },
      uploadName: "lead",
    });
    await leadService.remove(req.params.id);
    res.json({ status: true, message: "Lead deleted successfully!", data: {} });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function addDisposition(req, res) {
  try {
    if (req.user) {
      req.body.createdBy = req.user._id;
    }
    const data = await leadService.addDisposition(req.params.id, req.body);
    res.json({ status: true, message: "Call log added successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = { find, findById, create, update, remove, addDisposition };
