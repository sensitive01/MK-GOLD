const employeeService = require("../../services/employee");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.find(req.body ?? {}),
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
    res.json({
      status: true,
      message: "",
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

module.exports = { find, findById, findByBranchId, create, update, remove };
