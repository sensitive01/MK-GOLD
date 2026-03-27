const attendanceService = require("../../services/attendance");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await attendanceService.find(req.body ?? {}, req.user),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await attendanceService.findById(req.params.id),
  });
}

async function create(req, res) {
  try {
    if (req.user && req.user.branch) {
        if (!req.body.branch) {
            req.body.branch = req.user.branch?._id || req.user.branch;
        }
    }
    let createdData = await attendanceService.create(req.body);
    res.json({
      status: true,
      message: "Attendance marked successfully!",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "attendance" },
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
      data: await attendanceService.update(req.params.id, req.body),
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
      uploadName: "attendance",
    });

    res.json({
      status: true,
      message: "",
      data: await attendanceService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function getStats(req, res) {
  try {
    const branchId = req.user.branch?._id || req.user.branch;
    const type = req.user.userType?.toLowerCase();
    let employeeId = null;
    if (["assistant_branch_manager", "branch_executive", "telecalling", "finance", "accounts", "operations"].includes(type)) {
      employeeId = req.user.employee?._id || req.user.employee;
    }

    if (!branchId && !employeeId) {
      return res.json({ status: false, message: "No branch or employee ID found", data: { total: 0, present: 0, absent: 0 } });
    }
    
    const stats = await attendanceService.branchStats(branchId, employeeId);
    res.json({
      status: true,
      message: "Branch attendance stats retrieved!",
      data: stats,
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, create, update, remove, getStats };
