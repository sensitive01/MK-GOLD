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
      message: "User created successfully!",
      data: await userService.create(req.body),
    });
  } catch (err) {
    if (err.code === 11000) {
      res.json({
        status: false,
        message: "Same User already exists or username is already taken",
        data: {},
      });
    } else {
      res.json({
        status: false,
        message: err.errors ? Object.values(err.errors).map(e => e.message).join(", ") : (err.message || "Failed to create user"),
        data: {},
      });
    }
  }
}

async function update(req, res) {
  try {
    const payload = req.body;
    if (req.user && req.user._id) {
      payload.lastEditedBy = req.user._id;
    }
    res.json({
      status: true,
      message: "User updated successfully!",
      data: await userService.update(req.params.id, payload),
    });
  } catch (err) {
    if (err.code === 11000) {
      res.json({
        status: false,
        message: "Same User already exists or username is already taken",
        data: {},
      });
    } else {
      res.json({
        status: false,
        message: err.errors ? Object.values(err.errors).map(e => e.message).join(", ") : (err.message || "Failed to update user"),
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
