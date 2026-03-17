const goldRateService = require("../../services/goldrate");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await goldRateService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await goldRateService.findById(req.params.id),
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
    res.json({
      status: true,
      message: "",
      data: await goldRateService.create(req.body),
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
      data: await goldRateService.update(req.params.id, req.body),
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
      data: await goldRateService.remove(req.params.id),
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
