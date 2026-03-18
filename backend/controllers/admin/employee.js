const employeeService = require("../../services/employee");
const userService = require("../../services/user");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  let data;
  if (Object.keys(req.body).length === 0) {
    data = await employeeService.findAllWithBranch();
  } else {
    data = await employeeService.find(req.body);
  }
  res.json({
    status: true,
    message: "",
    data: data,
  });
}

async function getLoginNotCreatedEmployee(req, res) {
  let users = await userService.find();
  let employeeIdsWithUser = users
    .filter((u) => u?.employee?._id)
    .map((u) => u?.employee?._id.toString());
  
  let allEmployees = await employeeService.find({});
  
  let data = allEmployees
    .filter(emp => !employeeIdsWithUser.includes(emp._id.toString()))
    .map(emp => {
      const empObj = emp.toObject ? emp.toObject() : emp;
      return {
        ...empObj,
        hasUser: false
      };
    });

  res.json({
    status: true,
    message: "",
    data: data,
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

async function getNextEmployeeId(req, res) {
  try {
    res.json({
      status: true,
      data: await employeeService.getNextEmployeeId(),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message,
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
  getNextEmployeeId,
};
