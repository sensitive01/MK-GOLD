var express = require("express");
var router = express.Router();
var hrRouter = express.Router();
const passport = require("passport");
const dashboard = require("../controllers/hr/dashboard");
const branch = require("../controllers/hr/branch");
const user = require("../controllers/hr/user");
const employee = require("../controllers/hr/employee");
const profile = require("../controllers/hr/profile");
const leave = require("../controllers/hr/leave");
const fileUpload = require("../controllers/hr/fileupload");
const attendance = require("../controllers/hr/attendance");
const payprocess = require("../controllers/hr/payprocess");
const { isHr } = require("../middlewares/authorization");
const multer = require("../config/multer");

hrRouter.get("/", function (req, res, next) {
  res.send("Home Page");
});

hrRouter.get("/dashboard/get", dashboard.get);

hrRouter.get("/branch/get", branch.find);
hrRouter.post("/branch/get", branch.find);
hrRouter.get("/branch/get/:id", branch.findById);
hrRouter.post("/branch/create", branch.create);
hrRouter.post("/branch/update/:id", branch.update);
hrRouter.post("/branch/delete/:id", branch.remove);

hrRouter.get("/user/get", user.find);
hrRouter.post("/user/get", user.find);
hrRouter.get("/user/get/:id", user.findById);
hrRouter.post("/user/create", user.create);
hrRouter.post("/user/update/:id", user.update);
hrRouter.post("/user/delete/:id", user.remove);

hrRouter.get("/employee/get", employee.find);
hrRouter.post("/employee/get", employee.find);
hrRouter.get(
  "/employee/login-not-created",
  employee.getLoginNotCreatedEmployee
);
hrRouter.get("/employee/get/:id", employee.findById);
hrRouter.post("/employee/create", employee.create);
hrRouter.post("/employee/update/:id", employee.update);
hrRouter.post("/employee/delete/:id", employee.remove);

hrRouter.get("/attendance/get", attendance.find);
hrRouter.post("/attendance/get", attendance.find);
hrRouter.post("/attendance/consolidated", attendance.consolidated);
hrRouter.get("/attendance/get/:id", attendance.findById);
hrRouter.post("/attendance/update/:id", attendance.update);
hrRouter.post("/attendance/delete/:id", attendance.remove);

hrRouter.get("/leave/get", leave.find);
hrRouter.post("/leave/get", leave.find);
hrRouter.get("/leave/get/:id", leave.findById);
hrRouter.post("/leave/update/:id", leave.update);
hrRouter.post("/leave/delete/:id", leave.remove);

hrRouter.get("/payprocess/get", payprocess.find);
hrRouter.post("/payprocess/get", payprocess.find);
hrRouter.get("/payprocess/get/:id", payprocess.findById);
hrRouter.post("/payprocess/create", payprocess.create);
hrRouter.post("/payprocess/update/:id", payprocess.update);
hrRouter.post("/payprocess/delete/:id", payprocess.remove);

hrRouter.get("/file-upload/get", fileUpload.find);
hrRouter.post("/file-upload/get", fileUpload.find);
hrRouter.get("/file-upload/get/:id", fileUpload.findById);
hrRouter.post(
  "/file-upload/create",
  multer.single("uploadedFile"),
  fileUpload.create
);
hrRouter.post("/file-upload/delete/:id", fileUpload.remove);

hrRouter.get("/profile", profile.get);
hrRouter.post("/profile/change-password", profile.changePassword);

router.use(
  function (req, res, next) {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      if (err) {
        return res.status(400).json({
          status: false,
          message: err ?? "Unauthorized",
          data: {},
        });
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  isHr,
  hrRouter
);

module.exports = router;
