var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
require("dotenv/config");
require("./config/db");
require("./config/passport");

var authRouter = require("./routes/auth");
var adminRouter = require("./routes/admin");
var hrRouter = require("./routes/hr");
var accountsRouter = require("./routes/accounts");
var branchRouter = require("./routes/branch");
var customerRouter = require("./routes/customer");

var app = express();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(cors());
app.options("*", cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/v1.0/auth", authRouter);
app.use("/api/v1.0/admin", adminRouter);
app.use("/api/v1.0/hr", hrRouter);
app.use("/api/v1.0/accounts", accountsRouter);
app.use("/api/v1.0/branch", branchRouter);
app.use("/api/v1.0/customer", customerRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const port = process.env.PORT || 4999;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
module.exports = app;
