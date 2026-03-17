var express = require("express");
var router = express.Router();
var customerRouter = express.Router();
const {
  login,
  verifyOtp,
  verifyToken,
} = require("../controllers/customer/auth");
const profile = require("../controllers/customer/profile");
const goldRate = require("../controllers/customer/goldrate");
const branch = require("../controllers/customer/branch");
const sales = require("../controllers/customer/sales");
const support = require("../controllers/customer/support");
const supportReply = require("../controllers/customer/support-reply");
const fileUpload = require("../controllers/customer/fileupload");
const multer = require("../config/multer");

router.post("/login", login);
router.post("/verify-otp", verifyOtp);

customerRouter.post("/goldrate", goldRate.latest);

customerRouter.get("/branch/get", branch.find);
customerRouter.get("/branch/get/:id", branch.findById);
customerRouter.post("/branch/find", branch.findOne);

customerRouter.get("/sales/get", sales.find);
customerRouter.get("/sales/get/:id", sales.findById);
customerRouter.post("/sales/create", sales.create);
customerRouter.post("/sales/update/:id", sales.update);
customerRouter.post("/sales/delete/:id", sales.remove);

customerRouter.get("/profile", profile.get);
customerRouter.post("/profile", profile.update);

customerRouter.get("/support/get", support.find);
customerRouter.get("/support/get/:id", support.findById);
customerRouter.post("/support/create", support.create);
customerRouter.post("/support/update/:id", support.update);
customerRouter.post("/support/delete/:id", support.remove);

customerRouter.get("/support-reply/get", supportReply.find);
customerRouter.get("/support-reply/get/:id", supportReply.findById);
customerRouter.get("/support-reply/get-by-support-id/:id", supportReply.findBySupportId);
customerRouter.post("/support-reply/create", supportReply.create);
customerRouter.post("/support-reply/update/:id", supportReply.update);
customerRouter.post("/support-reply/delete/:id", supportReply.remove);

customerRouter.get("/file-upload/get", fileUpload.find);
customerRouter.post("/file-upload/get", fileUpload.find);
customerRouter.get("/file-upload/get/:id", fileUpload.findById);
customerRouter.post(
  "/file-upload/create",
  multer.single("uploadedFile"),
  fileUpload.create
);
customerRouter.post("/file-upload/delete/:id", fileUpload.remove);

router.use(verifyToken, customerRouter);

module.exports = router;
