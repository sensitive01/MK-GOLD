function isAdmin(req, res, next) {
  const userType = req.user?.userType?.toLowerCase();
  if (userType === "admin" || userType === "subadmin" || userType === "auditor") {
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
  const userType = req.user?.userType?.toLowerCase();
  if (userType === "accounts" || userType === "finance" || userType === "operations") {
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
    userType === "transaction_executive" ||
    userType === "telecalling" ||
    userType === "bullion_desk" ||
    userType === "marketing" ||
    userType === "admin_desk" ||
    userType === "admin" ||
    userType === "finance" ||
    userType === "operations" ||
    userType === "subadmin" ||
    userType === "hr" ||
    userType === "auditor"
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

function notFinance(req, res, next) {
  const userType = req.user?.userType?.toLowerCase();
  if (userType !== "finance") {
    return next();
  }

  return res.status(401).json({
    status: false,
    message: "Unauthorized: Finance role has read-only access",
    data: {},
  });
}

function enforceAuditorReadOnly(req, res, next) {
  if (req.user?.userType?.toLowerCase() === "auditor") {
    const path = req.path.toLowerCase();
    
    const isWriteAction = path.includes("/create") || path.includes("/update") || path.includes("/delete") || path.includes("/remove");

    if (isWriteAction) {
      return res.status(403).json({
        status: false,
        message: "Unauthorized: Auditor has read-only access for this action",
        data: {},
      });
    }
  }
  return next();
}

module.exports = { isAdmin, isHr, isAccounts, isBranch, canDelete, notFinance, enforceAuditorReadOnly };
