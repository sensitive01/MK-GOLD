const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
require("dotenv").config();

require("./config/db");
require("./config/passport");

const authRouter = require("./routes/auth");
const adminRouter = require("./routes/admin");
const hrRouter = require("./routes/hr");
const accountsRouter = require("./routes/accounts");
const branchRouter = require("./routes/branch");
const customerRouter = require("./routes/customer");
const announcementRouter = require("./routes/announcement");
const publicRouter = require("./routes/public");

const app = express();

// ✅ TRUST PROXY (important for nginx)
app.set("trust proxy", 1);

// ✅ CORS CONFIG (production safe)
const allowedOrigins = [
  "https://mkgold.tech",
  "https://www.mkgold.tech",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, curl, postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS not allowed"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

app.options("*", cors());

// middleware
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// routes
app.use("/api/v1.0/auth", authRouter);
app.use("/api/v1.0/admin", adminRouter);
app.use("/api/v1.0/hr", hrRouter);
app.use("/api/v1.0/accounts", accountsRouter);
app.use("/api/v1.0/branch", branchRouter);
app.use("/api/v1.0/customer", customerRouter);
app.use("/api/v1.0/announcement", announcementRouter);
app.use("/api/v1.0/public", publicRouter);

// health check (VERY USEFUL)
app.get("/", (req, res) => {
  res.json({ message: "API is running 🚀" });
});

// 404 handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

module.exports = app;