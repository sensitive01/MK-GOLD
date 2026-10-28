const Task = require("../models/task");
const Employee = require("../models/employee");
const mongoose = require("mongoose");

function safeParseArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      return [parsed];
    } catch (e) {
      return val.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [val];
}

function detectFileType(mime = "", filename = "") {
  const m = mime.toLowerCase();
  const f = filename.toLowerCase();
  if (m.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg|avif|heic)$/i.test(f)) {
    return "image";
  }
  if (m.startsWith("video/") || /\.(mp4|mov|avi|wmv|mkv|webm)$/i.test(f)) {
    return "video";
  }
  if (
    m.includes("pdf") ||
    m.includes("word") ||
    m.includes("excel") ||
    m.includes("sheet") ||
    m.includes("text") ||
    /\.(pdf|doc|docx|xls|xlsx|csv|txt|ppt|pptx)$/i.test(f)
  ) {
    return "document";
  }
  return "other";
}

async function find(query = {}) {
  try {
    const filter = {};

    if (query.status && query.status !== "all") {
      filter.status = query.status;
    }
    if (query.priority && query.priority !== "all") {
      filter.priority = query.priority;
    }
    if (query.taskType && query.taskType !== "all") {
      filter.taskType = query.taskType;
    }
    if (query.search) {
      const regex = new RegExp(query.search.trim(), "i");
      filter.$or = [{ title: regex }, { description: regex }, { remarks: regex }];
    }
    if (query.assignedEmployee) {
      filter.assignedEmployees = new mongoose.Types.ObjectId(query.assignedEmployee);
    }
    if (query.targetUserType) {
      filter.targetUserTypes = query.targetUserType;
    }
    if (query.targetDesignation) {
      filter.targetDesignations = query.targetDesignation;
    }
    if (query.startDate || query.endDate) {
      filter.deadline = {};
      if (query.startDate) filter.deadline.$gte = new Date(query.startDate);
      if (query.endDate) filter.deadline.$lte = new Date(query.endDate);
    }

    return await Task.find(filter)
      .populate("assignedEmployees", "name employeeId designation branch phoneNumber email")
      .populate("createdBy", "username userType")
      .populate("history.updatedBy", "username userType")
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await Task.findById(id)
      .populate("assignedEmployees", "name employeeId designation branch phoneNumber email")
      .populate("createdBy", "username userType")
      .populate("history.updatedBy", "username userType")
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findForUser(user) {
  try {
    const userId = user._id;

    // Fetch employee details
    let employee = null;
    const empId = user.employee?._id || user.employee;
    if (empId) {
      employee = await Employee.findById(empId).lean();
    }
    if (!employee && user.username) {
      employee = await Employee.findOne({
        $or: [{ employeeId: user.username }, { phoneNumber: user.username }],
      }).lean();
    }

    const orConditions = [
      { createdBy: new mongoose.Types.ObjectId(userId) },
    ];

    if (employee) {
      orConditions.push({ assignedEmployees: new mongoose.Types.ObjectId(employee._id) });
    }

    // Also match in case user ID was directly stored
    orConditions.push({ assignedEmployees: new mongoose.Types.ObjectId(userId) });

    const filter = {
      $or: orConditions,
    };

    return await Task.find(filter)

      .populate("assignedEmployees", "name employeeId designation branch phoneNumber email")
      .populate("createdBy", "username userType")
      .populate("history.updatedBy", "username userType")
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload, files = [], user = null) {
  try {
    const data = { ...payload };

    if (data.targetUserTypes) {
      data.targetUserTypes = safeParseArray(data.targetUserTypes);
    }
    if (data.targetDesignations) {
      data.targetDesignations = safeParseArray(data.targetDesignations);
    }
    if (data.assignedEmployees) {
      const parsed = safeParseArray(data.assignedEmployees);
      data.assignedEmployees = parsed
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));
    }

    if (data.deadline === "" || data.deadline === "null") {
      data.deadline = null;
    }

    let attachments = [];
    if (data.attachments) {
      attachments = safeParseArray(data.attachments);
    }

    if (files && files.length > 0) {
      files.forEach((file) => {
        attachments.push({
          name: file.originalname || "attachment",
          url: file.path || file.secure_url,
          fileType: detectFileType(file.mimetype, file.originalname),
          size: file.size || 0,
        });
      });
    }
    data.attachments = attachments;

    if (user && user._id) {
      data.createdBy = user._id;
      data.history = [
        {
          status: data.status || "pending",
          remarks: data.remarks || "Task created",
          updatedBy: user._id,
          updatedAt: new Date(),
        },
      ];
    }

    const task = new Task(data);
    const saved = await task.save();
    return await findById(saved._id);
  } catch (err) {
    throw err;
  }
}

async function update(id, payload, files = [], user = null) {
  try {
    const existing = await Task.findById(id);
    if (!existing) {
      throw new Error("Task not found");
    }

    const data = { ...payload };

    if (data.targetUserTypes !== undefined) {
      data.targetUserTypes = safeParseArray(data.targetUserTypes);
    }
    if (data.targetDesignations !== undefined) {
      data.targetDesignations = safeParseArray(data.targetDesignations);
    }
    if (data.assignedEmployees !== undefined) {
      const parsed = safeParseArray(data.assignedEmployees);
      data.assignedEmployees = parsed
        .filter((empId) => mongoose.Types.ObjectId.isValid(empId))
        .map((empId) => new mongoose.Types.ObjectId(empId));
    }

    if (data.deadline === "" || data.deadline === "null") {
      data.deadline = null;
    }

    // Retain or replace attachments
    let attachments = [];
    if (data.existingAttachments) {
      attachments = safeParseArray(data.existingAttachments);
    } else if (data.attachments) {
      attachments = safeParseArray(data.attachments);
    } else {
      attachments = existing.attachments || [];
    }

    if (files && files.length > 0) {
      files.forEach((file) => {
        attachments.push({
          name: file.originalname || "attachment",
          url: file.path || file.secure_url,
          fileType: detectFileType(file.mimetype, file.originalname),
          size: file.size || 0,
        });
      });
    }
    data.attachments = attachments;

    // Check if status changed or remarks updated
    const isStatusChanged = data.status && data.status !== existing.status;
    const hasNewRemarks = data.remarks && data.remarks !== existing.remarks;

    if (isStatusChanged || hasNewRemarks) {
      const historyItem = {
        status: data.status || existing.status,
        remarks: data.remarks || (isStatusChanged ? `Status updated to ${data.status}` : "Remarks updated"),
        updatedBy: user ? user._id : null,
        updatedAt: new Date(),
      };
      if (!data.history) {
        data.history = existing.history || [];
      }
      data.history.push(historyItem);
    }

    await Task.findByIdAndUpdate(id, data, { new: true });
    return await findById(id);
  } catch (err) {
    throw err;
  }
}

async function updateStatus(id, { status, remarks }, user = null) {
  try {
    const existing = await Task.findById(id);
    if (!existing) {
      throw new Error("Task not found");
    }

    const historyItem = {
      status: status || existing.status,
      remarks: remarks || `Status changed to ${status}`,
      updatedBy: user ? user._id : null,
      updatedAt: new Date(),
    };

    const updateData = {
      status: status || existing.status,
      $push: { history: historyItem },
    };
    if (remarks) {
      updateData.remarks = remarks;
    }

    await Task.findByIdAndUpdate(id, updateData, { new: true });
    return await findById(id);
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    if (typeof id === "string" && id.includes(",")) {
      return await Task.deleteMany({ _id: { $in: id.split(",") } });
    }
    return await Task.findByIdAndDelete(id);
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  findForUser,
  create,
  update,
  updateStatus,
  remove,
};
