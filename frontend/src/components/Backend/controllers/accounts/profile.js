const userService = require("../../services/user");

async function get(req, res) {
  res.json({
    status: true,
    message: "",
    data: await userService.findById(req.user.id),
  });
}

async function changePassword(req, res) {
  if (!req.body.password) {
    return res.json({
      status: true,
      message: "Please enter new password",
      data: {},
    });
  }
  res.json({
    status: true,
    message: "",
    data: await userService.update(req.user.id, {
      password: req.body.password,
    }),
  });
}

module.exports = { get, changePassword };
