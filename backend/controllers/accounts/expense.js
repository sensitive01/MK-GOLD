const expenseService = require("../../services/expense");
const salesService = require("../../services/sales");
const mongoose = require("mongoose");

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function cleanPayload(body) {
  const payload = { ...body };
  
  const objectIdFields = ["branch", "bill", "employee", "createdBy", "approvedBy"];
  objectIdFields.forEach((field) => {
    if (!payload[field] || !mongoose.Types.ObjectId.isValid(String(payload[field]))) {
      delete payload[field];
    }
  });

  const numberFields = ["openingRead", "closingRead", "overallRead"];
  numberFields.forEach((field) => {
    if (payload[field] === "" || payload[field] == null || isNaN(payload[field])) {
      delete payload[field];
    } else {
      payload[field] = Number(payload[field]);
    }
  });

  if (payload.amount != null && !isNaN(payload.amount)) {
    payload.amount = Number(payload.amount);
  }

  return payload;
}

function formatErrorMessage(err) {
  if (err.errors && typeof err.errors === "object") {
    return Object.values(err.errors).map((e) => e.message || String(e)).join(", ");
  }
  return err.message || "An error occurred";
}

async function find(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await expenseService.find(req.body ?? {}),
    });
  } catch (err) {
    res.json({
      status: false,
      message: formatErrorMessage(err),
      data: [],
    });
  }
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await expenseService.findById(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: formatErrorMessage(err),
      data: {},
    });
  }
}

async function create(req, res) {
  try {
    const userType = req.user?.userType?.toLowerCase() || "";
    const isAutoApproved = ["admin", "subadmin", "finance", "accounts"].includes(userType);

    if (isAutoApproved) {
      req.body.status = "approved";
      req.body.approvedBy = req.user?._id;
      req.body.approvedRole = req.user?.userType;
      req.body.approvedAt = new Date();
    } else {
      req.body.status = "pending";
    }

    req.body.createdBy = req.user?._id;
    req.body.creatorRole = req.user?.userType;

    if (req.body.closingRead != null && req.body.openingRead != null) {
      const op = Number(req.body.openingRead);
      const cl = Number(req.body.closingRead);
      if (!isNaN(op) && !isNaN(cl)) {
        req.body.overallRead = Math.max(0, cl - op);
      }
    }

    const cleaned = cleanPayload(req.body);
    let createdData = await expenseService.create(cleaned);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "expense" },
      },
    });
  } catch (err) {
    res.json({
      status: false,
      message: formatErrorMessage(err),
      data: {},
    });
  }
}

async function update(req, res) {
  try {
    if (req.body.status && ["approved", "rejected"].includes(req.body.status)) {
      const userType = req.user?.userType?.toLowerCase() || "";
      const canApprove = ["admin", "subadmin", "finance", "accounts"].includes(userType);
      if (!canApprove) {
        return res.status(403).json({
          status: false,
          message: "Only Finance and Admin can approve or reject expenses",
          data: {},
        });
      }
      req.body.approvedBy = req.user?._id;
      req.body.approvedRole = req.user?.userType;
      req.body.approvedAt = new Date();
    }

    if (req.body.closingRead != null && req.body.openingRead != null) {
      const op = Number(req.body.openingRead);
      const cl = Number(req.body.closingRead);
      if (!isNaN(op) && !isNaN(cl)) {
        req.body.overallRead = Math.max(0, cl - op);
      }
    }

    const cleaned = cleanPayload(req.body);
    res.json({
      status: true,
      message: "",
      data: await expenseService.update(req.params.id, cleaned),
    });
  } catch (err) {
    res.json({
      status: false,
      message: formatErrorMessage(err),
      data: {},
    });
  }
}

async function remove(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await expenseService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: formatErrorMessage(err),
      data: {},
    });
  }
}

async function getTodayBills(req, res) {
  try {
    const branchId = req.params.branchId || req.query.branchId;
    const today = getTodayString();
    const query = {
      createdAt: {
        $gte: today,
        $lte: today,
      },
    };
    if (branchId) {
      query.branch = branchId;
    }
    const sales = await salesService.find(query);
    const result = (sales || []).map((s) => ({
      _id: s._id,
      billId: s.billId,
      grossAmount: s.grossAmount || s.totalAmount || s.netAmount || 0,
      employee: s.employee,
    }));
    res.json({
      status: true,
      message: "",
      data: result,
    });
  } catch (err) {
    res.json({
      status: false,
      message: formatErrorMessage(err),
      data: [],
    });
  }
}

module.exports = { find, findById, create, update, remove, getTodayBills };
