const release = require("../../services/release");
const fileUploadService = require("../../services/fileupload");
const Sales = require("../../models/sales");

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
    const payload = { ...req.body };
    payload.actionBy = req.user.employee || req.user._id;
    payload.actionAt = new Date();
    let createdData = await release.create(payload);
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
    const { status, ...rest } = req.body;
    if (status) {
      const performerId = req.user.employee?._id || req.user.employee || req.user._id;
      const actionMap = {
        'release pending': 'Release Pending',
        'completed': 'Release Completed',
        'rejected': 'Rejected',
      };
      const logEntry = {
        action: actionMap[status] || status,
        performedBy: performerId,
        performedAt: new Date(),
      };
      const result = await release.updateWithLog(req.params.id, {
        ...rest,
        status,
        actionBy: performerId,
        actionAt: new Date(),
      }, logEntry);
      // NOTE: Release and Sale are independent.
      // Updating the release does NOT affect the sale status.
      res.json({ status: true, message: '', data: result });
    } else {
      res.json({
        status: true,
        message: '',
        data: await release.update(req.params.id, req.body),
      });
    }
  } catch (err) {
    res.json({ status: false, message: err.errors ?? err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    await fileUploadService.removeMany({
      uploadId: { $in: req.params.id.split(',') },
      uploadName: 'release',
    });
    res.json({
      status: true,
      message: '',
      data: await release.remove(req.params.id),
    });
  } catch (err) {
    res.json({ status: false, message: err.errors ?? err.message, data: {} });
  }
}

module.exports = { find, findById, create, update, remove };

