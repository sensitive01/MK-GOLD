function isAdmin(req, res, next) {
  if (req.user?.userType?.toLowerCase() === "admin") {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized",
    data: {},
  });
}

function isHr(req, res, next) {
  if (req.user?.userType?.toLowerCase() === "hr") {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized",
    data: {},
  });
}

function isAccounts(req, res, next) {
  if (req.user?.userType?.toLowerCase() === "accounts") {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized",
    data: {},
  });
}

function isBranch(req, res, next) {
  if (req.user?.userType?.toLowerCase() === "branch") {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized",
    data: {},
  });
}

module.exports = { isAdmin, isHr, isAccounts, isBranch };
