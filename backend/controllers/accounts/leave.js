const leaveService = require("../../services/leave");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  const query = req.body ?? {};
  // Filter by logged in user's employee ID
  if (req.user && req.user.employee) {
    query.employee = req.user.employee;
  }
  
  res.json({
    status: true,
    message: "",
    data: await leaveService.find(query),
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
    // Automatically set employee and branch from logged in user if not provided or empty
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
    res.json({
      status: true,
      message: "Leave Updated Successfully!",
      data: await leaveService.update(req.params.id, req.body, req.user),
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
      message: "Leave Deleted Successfully!",
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
