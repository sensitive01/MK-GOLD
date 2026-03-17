const employeeService = require("../../services/employee");

async function find(req, res) {
  const query = req.body ?? {};
  // If accounts person wants to see their own employee record
  if (req.user && req.user.employee) {
    query._id = req.user.employee;
  }
  
  res.json({
    status: true,
    message: "",
    data: await employeeService.find(query),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await employeeService.findById(req.params.id),
  });
}

module.exports = { find, findById };
