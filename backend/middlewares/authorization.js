function isAdmin(req, res, next) {
  const userType = req.user?.userType?.toLowerCase();
  if (userType === "admin" || userType === "subadmin") {
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
  const userType = req.user?.userType?.toLowerCase();
  if (
    userType === "branch" ||
    userType === "assistant_branch_manager" ||
    userType === "branch_executive" ||
    userType === "telecalling" ||
    userType === "admin" ||
    userType === "subadmin"
  ) {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized",
    data: {},
  });
}

function canDelete(req, res, next) {
  if (req.user?.userType?.toLowerCase() !== "subadmin") {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized to delete",
    data: {},
  });
}

module.exports = { isAdmin, isHr, isAccounts, isBranch, canDelete };
