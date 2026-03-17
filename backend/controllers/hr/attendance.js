const fs = require("fs");
const attendanceService = require("../../services/attendance");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await attendanceService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await attendanceService.findById(req.params.id),
  });
}

async function update(req, res) {
  try {
    if (req.file) {
      req.body.employeePhoto = `images/attendance/${req.file.originalname}`;
      fs.writeFileSync(`./public/${req.body.employeePhoto}`, req.file.buffer);
      let oldFile = await attendanceService.findById(req.params.id);
      if (oldFile.employeePhoto) {
        fs.unlink(`./public/${oldFile.employeePhoto}`, function (err) {
          // File not deleted
        });
      }
    }
    res.json({
      status: true,
      message: "",
      data: await attendanceService.update(req.params.id, req.body),
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
    let oldFile = await attendanceService.findById(req.params.id);
    if (oldFile.employeePhoto) {
      fs.unlink(`./public/${oldFile.employeePhoto}`, function (err) {
        // File not deleted
      });
    }
    res.json({
      status: true,
      message: "",
      data: await attendanceService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}
async function consolidated(req, res) {
  res.json({
    status: true,
    message: "",
    data: await attendanceService.consolidated(req.body ?? {}),
  });
}

module.exports = { find, findById, update, remove, consolidated };
