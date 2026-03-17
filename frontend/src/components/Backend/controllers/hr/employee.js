const employeeService = require("../../services/employee");
const userService = require("../../services/user");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.find(req.body ?? {}),
  });
}

async function getLoginNotCreatedEmployee(req, res) {
  let employees = await userService.find();
  let employeeIds = employees
    .filter((e) => e?.employee?.employeeId)
    .map((e) => e?.employee?.employeeId);
  res.json({
    status: true,
    message: "",
    data: await employeeService.find({
      employeeId: { $nin: employeeIds },
    }),
  });
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await employeeService.findById(req.params.id),
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
    let createdData = await employeeService.create(req.body);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "employee" },
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
      data: await employeeService.update(req.params.id, req.body),
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
      uploadName: "employee",
    });
    res.json({
      status: true,
      message: "",
      data: await employeeService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = {
  find,
  getLoginNotCreatedEmployee,
  findById,
  create,
  update,
  remove,
};
