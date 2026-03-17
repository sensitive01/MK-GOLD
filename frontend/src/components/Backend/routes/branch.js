var express = require("express");
var router = express.Router();
var branchRouter = express.Router();
const passport = require("passport");
const goldRate = require("../controllers/branch/goldrate");
const branch = require("../controllers/branch/branch");
const fund = require("../controllers/branch/fund");
const expense = require("../controllers/branch/expense");
const customer = require("../controllers/branch/customer");
const customerAddress = require("../controllers/branch/customer-address");
const customerBank = require("../controllers/branch/customer-bank");
const employee = require("../controllers/branch/employee");
const profile = require("../controllers/branch/profile");
const sales = require("../controllers/branch/sales");
const ornament = require("../controllers/branch/ornament");
const release = require("../controllers/branch/release");
const attendance = require("../controllers/branch/attendance");
const leave = require("../controllers/branch/leave");
const report = require("../controllers/branch/report");
const balancesheet = require("../controllers/branch/balancesheet");
const fileUpload = require("../controllers/branch/fileupload");
const { isBranch } = require("../middlewares/authorization");
const multer = require("../config/multer");

branchRouter.get("/", function (req, res, next) {
  res.send("Home Page");
});

branchRouter.get("/goldrate/get", goldRate.find);
branchRouter.post("/goldrate/get", goldRate.find);
branchRouter.get("/goldrate/get/:id", goldRate.findById);
branchRouter.post("/goldrate/find", goldRate.findOne);

branchRouter.get("/branch/get", branch.find);
branchRouter.post("/branch/get", branch.find);
branchRouter.get("/branch/get/:id", branch.findById);
branchRouter.post("/branch/find", branch.findOne);

branchRouter.get("/expense/get", expense.find);
branchRouter.post("/expense/get", expense.find);
branchRouter.get("/expense/get/:id", expense.findById);
branchRouter.post("/expense/create", expense.create);
branchRouter.post("/expense/update/:id", expense.update);
branchRouter.post("/expense/delete/:id", expense.remove);

branchRouter.get("/fund/get", fund.find);
branchRouter.post("/fund/find", fund.find);
branchRouter.get("/fund/get/:id", fund.findById);
branchRouter.post("/fund/create", fund.create);
branchRouter.post("/fund/update/:id", fund.update);
branchRouter.post("/fund/delete/:id", fund.remove);

branchRouter.get("/sales/get", sales.find);
branchRouter.post("/sales/get", sales.find);
branchRouter.get("/sales/get/:id", sales.findById);
branchRouter.post("/sales/create", sales.create);
branchRouter.post("/sales/update/:id", sales.update);
branchRouter.post("/sales/delete/:id", sales.remove);

branchRouter.get("/ornament/get", ornament.find);
branchRouter.post("/ornament/get", ornament.find);
branchRouter.post("/ornament/group-by", ornament.groupByBranchAndMovedAt);
branchRouter.post("/ornament/get-latest-print", ornament.getLatestPrint);
branchRouter.post("/ornament/update", ornament.update);

branchRouter.get("/balancesheet/get", balancesheet.find);
branchRouter.post("/balancesheet/get", balancesheet.find);
branchRouter.post(
  "/balancesheet/calculate-closing-balance",
  balancesheet.calculateClosingBalance
);

branchRouter.get("/release/get", release.find);
branchRouter.post("/release/get", release.find);
branchRouter.get("/release/get/:id", release.findById);
branchRouter.post("/release/create", release.create);
branchRouter.post("/release/update/:id", release.update);
branchRouter.post("/release/delete/:id", release.remove);

branchRouter.get("/customer/get", customer.find);
branchRouter.post("/customer/get", customer.find);
branchRouter.get("/customer/get/:id", customer.findById);
branchRouter.post("/customer/create", customer.create);
branchRouter.post("/customer/update/:id", customer.update);
branchRouter.post("/customer/delete/:id", customer.remove);
branchRouter.post("/customer/send-otp", customer.sendOtp);
branchRouter.post("/customer/verify-otp", customer.verifyOtp);

branchRouter.get("/customer-address/get/:id", customerAddress.findById);
branchRouter.post("/customer-address/create", customerAddress.create);
branchRouter.post("/customer-address/delete/:id", customerAddress.remove);

branchRouter.get("/customer-bank/get/:id", customerBank.findById);
branchRouter.post("/customer-bank/create", customerBank.create);
branchRouter.post("/customer-bank/delete/:id", customerBank.remove);

branchRouter.get("/employee/get", employee.find);
branchRouter.post("/employee/get", employee.find);
branchRouter.get("/employee/get/:id", employee.findById);
branchRouter.get("/employee/get-branch-employee/:id", employee.findByBranchId);
branchRouter.post("/employee/create", employee.create);
branchRouter.post("/employee/update/:id", employee.update);
branchRouter.post("/employee/delete/:id", employee.remove);

branchRouter.get("/attendance/get", attendance.find);
branchRouter.post("/attendance/get", attendance.find);
branchRouter.get("/attendance/get/:id", attendance.findById);
branchRouter.post("/attendance/create", attendance.create);
branchRouter.post("/attendance/update/:id", attendance.update);
branchRouter.post("/attendance/delete/:id", attendance.remove);

branchRouter.get("/leave/get", leave.find);
branchRouter.post("/leave/get", leave.find);
branchRouter.get("/leave/get/:id", leave.findById);
branchRouter.post("/leave/create", leave.create);
branchRouter.post("/leave/update/:id", leave.update);
branchRouter.post("/leave/delete/:id", leave.remove);

branchRouter.get("/file-upload/get", fileUpload.find);
branchRouter.post("/file-upload/get", fileUpload.find);
branchRouter.get("/file-upload/get/:id", fileUpload.findById);
branchRouter.post(
  "/file-upload/create",
  multer.single("uploadedFile"),
  fileUpload.create
);
branchRouter.post("/file-upload/delete/:id", fileUpload.remove);

branchRouter.get("/profile", profile.get);
branchRouter.post("/profile/change-password", profile.changePassword);

branchRouter.get(
  "/report/get-consolidated-sale-report",
  report.consolidatedSaleReport
);
branchRouter.post(
  "/report/get-consolidated-sale-report",
  report.consolidatedSaleReport
);

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
  isBranch,
  branchRouter
);

module.exports = router;
