var express = require("express");
var router = express.Router();
var accountsRouter = express.Router();
const passport = require("passport");
const dashboard = require("../controllers/admin/dashboard");
const goldRate = require("../controllers/accounts/goldrate");
const branch = require("../controllers/accounts/branch");
const fund = require("../controllers/accounts/fund.js");
const expense = require("../controllers/accounts/expense");
const sales = require("../controllers/accounts/sales");
const ornament = require("../controllers/accounts/ornament");
const profile = require("../controllers/accounts/profile");
const balancesheet = require("../controllers/accounts/balancesheet");
const fileUpload = require("../controllers/accounts/fileupload");
const { isAccounts } = require("../middlewares/authorization");
const multer = require("../config/multer");

accountsRouter.get("/", function (req, res, next) {
  res.send("Home Page");
});

accountsRouter.get("/dashboard/get", dashboard.get);

accountsRouter.get("/goldrate/get", goldRate.find);
accountsRouter.post("/goldrate/get", goldRate.find);
accountsRouter.get("/goldrate/get/:id", goldRate.findById);
accountsRouter.post("/goldrate/create", goldRate.create);
accountsRouter.post("/goldrate/update/:id", goldRate.update);
accountsRouter.post("/goldrate/delete/:id", goldRate.remove);

accountsRouter.get("/branch/get", branch.find);
accountsRouter.post("/branch/get", branch.find);
accountsRouter.get("/branch/state", branch.getState);
accountsRouter.get("/branch/get/:id", branch.findById);

accountsRouter.get("/fund/get", fund.find);
accountsRouter.post("/fund/get", fund.find);
accountsRouter.get("/fund/get/:id", fund.findById);
accountsRouter.post("/fund/update/:id", fund.update);
accountsRouter.post("/fund/delete/:id", fund.remove);

accountsRouter.get("/expense/get", expense.find);
accountsRouter.post("/expense/get", expense.find);
accountsRouter.get("/expense/get/:id", expense.findById);
accountsRouter.post("/expense/create", expense.create);
accountsRouter.post("/expense/update/:id", expense.update);
accountsRouter.post("/expense/delete/:id", expense.remove);

accountsRouter.get("/sales/get", sales.find);
accountsRouter.post("/sales/get", sales.find);
accountsRouter.get("/sales/get/:id", sales.findById);
accountsRouter.post("/sales/update/:id", sales.update);
accountsRouter.post("/sales/delete/:id", sales.remove);

accountsRouter.get("/ornament/get", ornament.find);
accountsRouter.post("/ornament/get", ornament.find);
accountsRouter.post("/ornament/group-by", ornament.groupByBranchAndMovedAt);
accountsRouter.post("/ornament/update", ornament.update);

accountsRouter.get("/balancesheet/get", balancesheet.find);
accountsRouter.post("/balancesheet/get", balancesheet.find);
accountsRouter.post(
  "/balancesheet/calculate-closing-balance",
  balancesheet.calculateClosingBalance
);

accountsRouter.get("/file-upload/get", fileUpload.find);
accountsRouter.post("/file-upload/get", fileUpload.find);
accountsRouter.get("/file-upload/get/:id", fileUpload.findById);
accountsRouter.post(
  "/file-upload/create",
  multer.single("uploadedFile"),
  fileUpload.create
);
accountsRouter.post("/file-upload/delete/:id", fileUpload.remove);

accountsRouter.get("/profile", profile.get);
accountsRouter.post("/profile/change-password", profile.changePassword);

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
  isAccounts,
  accountsRouter
);

module.exports = router;
