const branchService = require("../../services/branch");

async function getState(req, res) {
  res.json({
    status: true,
    message: "",
    data: await branchService.getState(),
  });
}

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await branchService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await branchService.findById(req.params.id),
  });
}

module.exports = { find, findById, getState };
