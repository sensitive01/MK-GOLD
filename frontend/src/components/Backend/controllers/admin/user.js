const userService = require("../../services/user");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await userService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await userService.findById(req.params.id),
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
      data: await userService.create(req.body),
    });
  } catch (err) {
    if (err.code === 11000) {
      res.json({
        status: false,
        message: "Same User already created",
        data: {},
      });
    } else {
      res.json({
        status: false,
        message: err.errors ?? err.message,
        data: {},
      });
    }
  }
}

async function update(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await userService.update(req.params.id, req.body),
    });
  } catch (err) {
    if (err.code === 11000) {
      res.json({
        status: false,
        message: "Same User already created",
        data: {},
      });
    } else {
      res.json({
        status: false,
        message: err.errors ?? err.message,
        data: {},
      });
    }
  }
}

async function remove(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await userService.remove(req.params.id),
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
