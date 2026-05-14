const salesService = require("../../services/sales");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await salesService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await salesService.findById(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function create(req, res) {
  try {
    let createdData = await salesService.create(req.body);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "sale" },
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
    const performerId = req.user.employee || req.user._id;
    let result;
    
    if (req.body.status) {
      const logEntry = {
        action: req.body.status,
        performedBy: performerId,
        performedAt: new Date(),
      };
      
      const updateData = { ...req.body };
      updateData.actionBy = performerId;
      updateData.actionAt = new Date();
      
      result = await salesService.updateWithLog(req.params.id, updateData, logEntry);
    } else {
      result = await salesService.update(req.params.id, req.body);
    }

    res.json({
      status: true,
      message: "",
      data: result,
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
      uploadName: "sale",
    });

    res.json({
      status: true,
      message: "",
      data: await salesService.remove(req.params.id),
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
