var express = require("express");
var router = express.Router();
var adminRouter = express.Router();
const passport = require("passport");
const dashboard = require("../controllers/admin/dashboard");
const goldRate = require("../controllers/admin/goldrate");
const branch = require("../controllers/admin/branch");
const user = require("../controllers/admin/user");
const employee = require("../controllers/admin/employee");
const fund = require("../controllers/admin/fund");
const expense = require("../controllers/admin/expense");
const profile = require("../controllers/admin/profile");
const leave = require("../controllers/admin/leave");
const attendance = require("../controllers/admin/attendance");
const sales = require("../controllers/admin/sales");
const ornament = require("../controllers/admin/ornament");
const customer = require("../controllers/admin/customer");
const release = require("../controllers/admin/release");
const fileUpload = require("../controllers/admin/fileupload");
const report = require("../controllers/admin/report");
const support = require("../controllers/admin/support");
const supportReply = require("../controllers/admin/support-reply");
const otp = require("../controllers/admin/otp");
const payprocess = require("../controllers/admin/payprocess");
const balancesheet = require("../controllers/admin/balancesheet");
const { isAdmin } = require("../middlewares/authorization");
const multer = require("../config/multer");

adminRouter.get("/", function (req, res, next) {
  res.send("Home Page");
});

adminRouter.get("/dashboard/get", dashboard.get);

adminRouter.get("/goldrate/get", goldRate.find);
adminRouter.post("/goldrate/get", goldRate.find);
adminRouter.get("/goldrate/get/:id", goldRate.findById);
adminRouter.post("/goldrate/create", goldRate.create);
adminRouter.post("/goldrate/update/:id", goldRate.update);
adminRouter.post("/goldrate/delete/:id", goldRate.remove);

adminRouter.get("/branch/get", branch.find);
adminRouter.post("/branch/get", branch.find);
adminRouter.get("/branch/state", branch.getState);
adminRouter.get("/branch/get/:id", branch.findById);
adminRouter.post("/branch/create", branch.create);
adminRouter.post("/branch/update/:id", branch.update);
adminRouter.post("/branch/delete/:id", branch.remove);

adminRouter.get("/user/get", user.find);
adminRouter.post("/user/get", user.find);
adminRouter.get("/user/get/:id", user.findById);
adminRouter.post("/user/create", user.create);
adminRouter.post("/user/update/:id", user.update);
adminRouter.post("/user/delete/:id", user.remove);

adminRouter.get("/employee/get", employee.find);
adminRouter.post("/employee/get", employee.find);
adminRouter.get(
  "/employee/login-not-created",
  employee.getLoginNotCreatedEmployee
);
adminRouter.get("/employee/get/:id", employee.findById);
adminRouter.post("/employee/create", employee.create);
adminRouter.post("/employee/update/:id", employee.update);
adminRouter.post("/employee/delete/:id", employee.remove);

adminRouter.get("/expense/get", expense.find);
adminRouter.post("/expense/get", expense.find);
adminRouter.get("/expense/get/:id", expense.findById);
adminRouter.post("/expense/update/:id", expense.update);
adminRouter.post("/expense/delete/:id", expense.remove);

adminRouter.get("/fund/get", fund.find);
adminRouter.post("/fund/get", fund.find);
adminRouter.get("/fund/get/:id", fund.findById);
adminRouter.post("/fund/update/:id", fund.update);
adminRouter.post("/fund/delete/:id", fund.remove);

adminRouter.get("/attendance/get", attendance.find);
adminRouter.post("/attendance/get", attendance.find);
adminRouter.get("/attendance/get/:id", attendance.findById);
adminRouter.post("/attendance/update/:id", attendance.update);
adminRouter.post("/attendance/delete/:id", attendance.remove);

adminRouter.get("/sales/get", sales.find);
adminRouter.post("/sales/get", sales.find);
adminRouter.get("/sales/get/:id", sales.findById);
adminRouter.post("/sales/update/:id", sales.update);
adminRouter.post("/sales/delete/:id", sales.remove);

adminRouter.get("/ornament/get", ornament.find);
adminRouter.post("/ornament/get", ornament.find);
adminRouter.post("/ornament/group-by", ornament.groupByBranchAndMovedAt);
adminRouter.post("/ornament/update", ornament.update);

adminRouter.get("/otp/get", otp.find);
adminRouter.post("/otp/get", otp.find);
adminRouter.get("/otp/get/:id", otp.findById);
adminRouter.post("/otp/update/:id", otp.update);
adminRouter.post("/otp/delete/:id", otp.remove);

adminRouter.get("/leave/get", leave.find);
adminRouter.post("/leave/get", leave.find);
adminRouter.get("/leave/get/:id", leave.findById);
adminRouter.post("/leave/update/:id", leave.update);
adminRouter.post("/leave/delete/:id", leave.remove);

adminRouter.get("/release/get", release.find);
adminRouter.post("/release/get", release.find);
adminRouter.get("/release/get/:id", release.findById);
adminRouter.post("/release/create", release.create);
adminRouter.post("/release/update/:id", release.update);
adminRouter.post("/release/delete/:id", release.remove);

adminRouter.get("/customer/get", customer.find);
adminRouter.post("/customer/get", customer.find);
adminRouter.get("/customer/get/:id", customer.findById);
adminRouter.post("/customer/create", customer.create);
adminRouter.post("/customer/update/:id", customer.update);
adminRouter.post("/customer/delete/:id", customer.remove);
adminRouter.post("/customer/send-otp", customer.sendOtp);
adminRouter.post("/customer/verify-otp", customer.verifyOtp);

adminRouter.get("/payprocess/get", payprocess.find);
adminRouter.post("/payprocess/get", payprocess.find);
adminRouter.get("/payprocess/get/:id", payprocess.findById);
adminRouter.post("/payprocess/create", payprocess.create);
adminRouter.post("/payprocess/update/:id", payprocess.update);
adminRouter.post("/payprocess/delete/:id", payprocess.remove);

adminRouter.get("/file-upload/get", fileUpload.find);
adminRouter.post("/file-upload/get", fileUpload.find);
adminRouter.get("/file-upload/get/:id", fileUpload.findById);
adminRouter.post(
  "/file-upload/create",
  multer.single("uploadedFile"),
  fileUpload.create
);
adminRouter.post("/file-upload/delete/:id", fileUpload.remove);

adminRouter.get("/profile", profile.get);
adminRouter.post("/profile/change-password", profile.changePassword);

adminRouter.get(
  "/report/get-consolidated-sale-report",
  report.consolidatedSaleReport
);
adminRouter.post(
  "/report/get-consolidated-sale-report",
  report.consolidatedSaleReport
);

adminRouter.get("/balancesheet/get", balancesheet.find);
adminRouter.post("/balancesheet/get", balancesheet.find);
adminRouter.post(
  "/balancesheet/calculate-closing-balance",
  balancesheet.calculateClosingBalance
);

adminRouter.get("/support/get", support.find);
adminRouter.post("/support/get", support.find);
adminRouter.get("/support/get/:id", support.findById);
adminRouter.post("/support/create", support.create);
adminRouter.post("/support/update/:id", support.update);
adminRouter.post("/support/delete/:id", support.remove);

adminRouter.get("/support-reply/get", supportReply.find);
adminRouter.post("/support-reply/get", supportReply.find);
adminRouter.get("/support-reply/get/:id", supportReply.findById);
adminRouter.get(
  "/support-reply/get-by-support-id/:id",
  supportReply.findBySupportId
);
adminRouter.post("/support-reply/create", supportReply.create);
adminRouter.post("/support-reply/update/:id", supportReply.update);
adminRouter.post("/support-reply/delete/:id", supportReply.remove);

router.use(
  function (req, res, next) {
    passport.authenticate("jwt", { session: false }, (err, user, info) => {
      if (err || !user) {
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
  isAdmin,
  adminRouter
);

module.exports = router;
