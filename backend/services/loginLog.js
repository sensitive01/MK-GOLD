const LoginLog = require("../models/loginLog");
const User = require("../models/user");
require("../models/branch");
require("../models/employee");
const { getIpAddress, parseUserAgent } = require("../utils/deviceParser");

/**
 * Record a login attempt asynchronously (non-blocking)
 */
async function recordLogin({ req, user, username, status = "success", failureReason = "", loginMethod = "password" }) {
  try {
    const rawUa = req ? req.headers["user-agent"] : "";
    const ipAddress = getIpAddress(req);
    const clientInfo = parseUserAgent(rawUa);

    let resolvedUser = user;
    const finalUsername = String(username || user?.username || req?.body?.username || "").trim();

    // If user object not provided (e.g. failed login attempt), try looking up user by username to enrich log
    if (!resolvedUser && finalUsername) {
      try {
        resolvedUser = await User.findOne({
          username: { $regex: new RegExp(`^${finalUsername}$`, "i") },
        })
          .populate("employee", "name")
          .populate("branch", "branchName")
          .lean()
          .exec();
      } catch (e) {
        // Ignore lookup error on failed attempt
      }
    }

    let name = "";
    let userType = "";
    let branchId = null;
    let branchName = "";
    let employeeId = null;

    if (resolvedUser) {
      userType = resolvedUser.userType || "";
      name = resolvedUser.employee?.name || resolvedUser.name || resolvedUser.username || finalUsername;
      employeeId = resolvedUser.employee?._id || resolvedUser.employee || null;
      branchId = resolvedUser.branch?._id || resolvedUser.branch || null;
      branchName = resolvedUser.branch?.branchName || "";
    }

    const logEntry = new LoginLog({
      user: resolvedUser?._id || null,
      employee: employeeId,
      username: finalUsername || "Unknown",
      name: name,
      userType: userType,
      branch: branchId,
      branchName: branchName,
      ipAddress: ipAddress,
      userAgent: rawUa,
      browser: clientInfo.browser,
      browserVersion: clientInfo.browserVersion,
      os: clientInfo.os,
      deviceType: clientInfo.deviceType,
      deviceModel: clientInfo.deviceModel,
      loginMethod: loginMethod,
      status: status,
      failureReason: failureReason,
    });

    await logEntry.save();
    return logEntry;
  } catch (err) {
    console.error("Error recording login log:", err.message);
    return null;
  }
}

/**
 * Find login logs with pagination, search, and filtering
 */
async function find(params = {}) {
  try {
    const query = {};

    // 1. Status Filter
    if (params.status && params.status !== "all" && params.status !== "All") {
      query.status = params.status.toLowerCase();
    }

    // 2. UserType / Role Filter
    if (params.userType && params.userType !== "all" && params.userType !== "All") {
      query.userType = { $regex: new RegExp(`^${params.userType}$`, "i") };
    }

    // 3. Date Range Filter
    if (params.startDate || params.endDate) {
      query.createdAt = {};
      if (params.startDate) {
        const startStr = String(params.startDate).substring(0, 10);
        query.createdAt.$gte = new Date(`${startStr}T00:00:00.000+05:30`);
      }
      if (params.endDate) {
        const endStr = String(params.endDate).substring(0, 10);
        query.createdAt.$lte = new Date(`${endStr}T23:59:59.999+05:30`);
      }
    }

    // 4. Search Filter (matches username, name, ip, browser, os, deviceModel)
    if (params.search && String(params.search).trim()) {
      const q = String(params.search).trim();
      const regex = new RegExp(q, "i");
      query.$or = [
        { username: regex },
        { name: regex },
        { userType: regex },
        { ipAddress: regex },
        { browser: regex },
        { os: regex },
        { deviceModel: regex },
        { branchName: regex },
      ];
    }

    const page = Math.max(1, parseInt(params.page, 10) || 1);
    const limit = Math.max(1, parseInt(params.limit, 10) || 25);
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      LoginLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "username userType")
        .populate("branch", "branchName")
        .lean()
        .exec(),
      LoginLog.countDocuments(query),
    ]);

    return {
      logs,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (err) {
    throw err;
  }
}

/**
 * Get summary metrics for today
 */
async function getStats() {
  try {
    const todayStr = new Date().toISOString().substring(0, 10);
    const todayStart = new Date(`${todayStr}T00:00:00.000+05:30`);
    const todayEnd = new Date(`${todayStr}T23:59:59.999+05:30`);

    const todayFilter = { createdAt: { $gte: todayStart, $lte: todayEnd } };

    const [totalToday, successToday, failedToday, uniqueUsersToday, allTimeCount] = await Promise.all([
      LoginLog.countDocuments(todayFilter),
      LoginLog.countDocuments({ ...todayFilter, status: "success" }),
      LoginLog.countDocuments({ ...todayFilter, status: "failed" }),
      LoginLog.distinct("username", todayFilter).then((users) => users.length),
      LoginLog.countDocuments(),
    ]);

    return {
      totalToday,
      successToday,
      failedToday,
      uniqueUsersToday,
      allTimeCount,
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  recordLogin,
  find,
  getStats,
};
