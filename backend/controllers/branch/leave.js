const leaveService = require("../../services/leave");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  const query = req.body ?? {};
  // Removed restrictive query.employee = req.user.employee overwrite here.
  // The leaveService now handles role-based filtering (Manager sees branch, employees see self) correctly.
  res.json({
    status: true,
    message: "",
    data: await leaveService.find(query, req.user),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await leaveService.findById(req.params.id),
  });
}

async function create(req, res) {
  try {
    if (req.user) {
      if (!req.body.employee || req.body.employee === "") {
        req.body.employee = req.user.employee;
      }
      if (!req.body.branch || req.body.branch === "" || req.body.branch === "null") {
        req.body.branch = req.user.branch?._id || req.user.branch;
      }
    }
    let createdData = await leaveService.create(req.body, req.user);
    res.json({
      status: true,
      message: "Leave Applied Successfully!",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "leave" },
      },
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message,
      data: {},
    });
  }
}

async function update(req, res) {
  try {
    const previousLeave = await leaveService.findById(req.params.id);
    const updatedLeave = await leaveService.update(req.params.id, req.body, req.user);
    
    // Notification logic for BM approval moving to HR
    if (req.user && req.user.userType?.toLowerCase() === "branch" && req.body.bmStatus === "approved") {
        // Send email to HR?
        console.log("Leave approved by BM, Notify HR branch: ", req.user.branch);
    }

    res.json({
      status: true,
      message: "Leave Updated Successfully!",
      data: updatedLeave,
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message,
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
      uploadName: "leave",
    });
    res.json({
      status: true,
      message: "",
      data: await leaveService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ? Object.values(err.errors).map(e => e.message).join(', ') : err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, create, update, remove };
