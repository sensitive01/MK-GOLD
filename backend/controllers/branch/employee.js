const employeeService = require("../../services/employee");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.find(req.body ?? {}, req.user),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.findById(req.params.id),
  });
}

async function findByBranchId(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.findByBranchId(req.params.id),
  });
}

async function create(req, res) {
  try {
    if (req.user && req.user.branch) {
        if (!req.body.branch) {
            req.body.branch = req.user.branch?._id || req.user.branch;
        }
    }
    res.json({
      status: true,
      message: "Employee created successfully!",
      data: await employeeService.create(req.body),
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

async function getNextId(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.getNextEmployeeId(),
  });
}

module.exports = { find, findById, findByBranchId, create, update, remove, getNextId };
