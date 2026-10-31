const mongoose = require("mongoose");
const Ticket = require("../models/ticket");
const Counter = require("../models/counter");
const Employee = require("../models/employee");
const User = require("../models/user");
const Designation = require("../models/designation");
const fileUploadService = require("./fileupload");

async function getNextTicketNumber() {
  try {
    const counter = await Counter.findOneAndUpdate(
      { key: "ticket_number" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    return `TK-${String(counter.value).padStart(5, "0")}`;
  } catch (err) {
    const fallback = Date.now().toString().slice(-6);
    return `TK-${fallback}`;
  }
}

async function findUserEmployee(user) {
  if (!user) return null;
  const empId = user.employee?._id || user.employee;
  if (empId) {
    const emp = await Employee.findById(empId).lean();
    if (emp) return emp;
  }
  if (user.username) {
    return await Employee.findOne({
      $or: [{ employeeId: user.username }, { phoneNumber: user.username }],
    }).lean();
  }
  return null;
}

async function create(payload = {}, file, user) {
  try {
    const ticketNumber = await getNextTicketNumber();
    const creatorEmp = await findUserEmployee(user);

    let assignedEmpName = "";
    if (payload.assignedEmployee) {
      const assignedEmp = await Employee.findById(payload.assignedEmployee).select("name").lean();
      if (assignedEmp) assignedEmpName = assignedEmp.name;
    }

    let proofUrl = payload.proof || "";
    if (file) {
      proofUrl = file.path || file.secure_url || file.filename || "";
    }

    const ticketData = {
      ticketNumber,
      issueType: payload.issueType,
      designation: payload.designation,
      assignedEmployee: payload.assignedEmployee,
      assignedEmployeeName: assignedEmpName,
      subject: payload.subject,
      description: payload.description,
      priority: payload.priority || "medium",
      deadline: payload.deadline ? new Date(payload.deadline) : new Date(Date.now() + 86400000),
      proof: proofUrl,
      status: "pending",
      createdBy: user?._id,
      creatorEmployee: creatorEmp?._id || null,
      creatorName: creatorEmp?.name || user?.username || "Unknown",
      creatorRole: user?.userType || "user",
      branch: user?.branch || creatorEmp?.branch || null,
      history: [
        {
          status: "pending",
          remarks: "Ticket raised",
          updatedBy: user?._id,
          updatedAt: new Date(),
        },
      ],
    };

    const newTicket = new Ticket(ticketData);
    const saved = await newTicket.save();

    if (file) {
      try {
        await fileUploadService.create({
          uploadId: saved._id,
          uploadName: "ticket_proof",
          uploadedFile: file,
        });
      } catch (fileErr) {
        console.warn("Could not save ticket upload record to fileuploads:", fileErr.message);
      }
    }

    return await Ticket.findById(saved._id)
      .populate("assignedEmployee", "name employeeId designation branch")
      .populate("branch", "name branchCode")
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findMyRaised(user, query = {}) {
  try {
    const filter = { createdBy: user._id };
    if (query.status && query.status !== "all") filter.status = query.status;
    if (query.priority && query.priority !== "all") filter.priority = query.priority;

    if (query.search) {
      const s = String(query.search).trim();
      const regex = new RegExp(s, "i");
      filter.$or = [
        { ticketNumber: regex },
        { subject: regex },
        { issueType: regex },
        { assignedEmployeeName: regex },
      ];
    }

    return await Ticket.find(filter)
      .populate("assignedEmployee", "name employeeId designation branch")
      .populate("branch", "name branchCode")
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findAssignedToMe(user, query = {}) {
  try {
    const emp = await findUserEmployee(user);
    const orConds = [];

    if (emp?._id) {
      orConds.push({ assignedEmployee: new mongoose.Types.ObjectId(emp._id) });
    }
    if (user?._id) {
      orConds.push({ assignedEmployee: new mongoose.Types.ObjectId(user._id) });
    }

    if (orConds.length === 0) {
      return [];
    }

    const filter = { $or: orConds };
    if (query.status && query.status !== "all") filter.status = query.status;
    if (query.priority && query.priority !== "all") filter.priority = query.priority;

    if (query.search) {
      const s = String(query.search).trim();
      const regex = new RegExp(s, "i");
      filter.$and = [
        {
          $or: [
            { ticketNumber: regex },
            { subject: regex },
            { issueType: regex },
            { creatorName: regex },
          ],
        },
      ];
    }

    return await Ticket.find(filter)
      .populate("assignedEmployee", "name employeeId designation branch")
      .populate("createdBy", "username userType")
      .populate("creatorEmployee", "name employeeId designation branch")
      .populate("branch", "name branchCode")
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findAll(query = {}) {
  try {
    const filter = {};
    if (query.status && query.status !== "all") filter.status = query.status;
    if (query.priority && query.priority !== "all") filter.priority = query.priority;
    if (query.designation && query.designation !== "all") filter.designation = query.designation;
    if (query.assignedEmployee) filter.assignedEmployee = query.assignedEmployee;

    if (query.search) {
      const s = String(query.search).trim();
      const regex = new RegExp(s, "i");
      filter.$or = [
        { ticketNumber: regex },
        { subject: regex },
        { issueType: regex },
        { creatorName: regex },
        { assignedEmployeeName: regex },
      ];
    }

    return await Ticket.find(filter)
      .populate("assignedEmployee", "name employeeId designation branch")
      .populate("createdBy", "username userType")
      .populate("creatorEmployee", "name employeeId designation branch")
      .populate("branch", "name branchCode")
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await Ticket.findById(id)
      .populate("assignedEmployee", "name employeeId designation branch phoneNumber")
      .populate("createdBy", "username userType")
      .populate("creatorEmployee", "name employeeId designation branch phoneNumber")
      .populate("branch", "name branchCode")
      .populate("history.updatedBy", "username userType")
      .exec();
  } catch (err) {
    throw err;
  }
}

async function updateStatus(id, { status, statusRemarks }, user) {
  try {
    const validStatuses = ["accepted", "rejected", "completed"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be accepted, rejected, or completed.`);
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) throw new Error("Ticket not found");

    ticket.status = status;
    ticket.statusRemarks = statusRemarks || "";
    ticket.statusUpdatedAt = new Date();
    ticket.statusUpdatedBy = user?._id;

    ticket.history.push({
      status,
      remarks: statusRemarks || `Ticket marked as ${status}`,
      updatedBy: user?._id,
      updatedAt: new Date(),
    });

    return await ticket.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload = {}, file, user) {
  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw new Error("Ticket not found");

    const isAdmin = ["admin", "subadmin", "hr"].includes(user?.userType);
    if (!isAdmin && String(ticket.createdBy) !== String(user?._id)) {
      throw new Error("You are not authorized to edit this ticket");
    }

    if (!isAdmin && ticket.status !== "pending") {
      throw new Error("Cannot edit a ticket once it has been accepted, rejected, or completed");
    }

    if (payload.issueType) ticket.issueType = payload.issueType;
    if (payload.designation) ticket.designation = payload.designation;
    if (payload.assignedEmployee) {
      ticket.assignedEmployee = payload.assignedEmployee;
      const emp = await Employee.findById(payload.assignedEmployee).select("name").lean();
      if (emp) ticket.assignedEmployeeName = emp.name;
    }
    if (payload.subject) ticket.subject = payload.subject;
    if (payload.description) ticket.description = payload.description;
    if (payload.priority) ticket.priority = payload.priority;
    if (payload.deadline) ticket.deadline = new Date(payload.deadline);

    if (file) {
      ticket.proof = file.path || file.secure_url || file.filename || "";
      try {
        await fileUploadService.create({
          uploadId: ticket._id,
          uploadName: "ticket_proof",
          uploadedFile: file,
        });
      } catch (e) {
        // ignore upload record error
      }
    }

    ticket.history.push({
      status: ticket.status,
      remarks: "Ticket details updated",
      updatedBy: user?._id,
      updatedAt: new Date(),
    });

    return await ticket.save();
  } catch (err) {
    throw err;
  }
}

async function remove(id, user) {
  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw new Error("Ticket not found");

    const isAdmin = ["admin", "subadmin"].includes(user?.userType);
    if (!isAdmin && String(ticket.createdBy) !== String(user?._id)) {
      throw new Error("You are not authorized to delete this ticket");
    }

    return await Ticket.findByIdAndDelete(id);
  } catch (err) {
    throw err;
  }
}

async function getDesignations() {
  try {
    const list = await Designation.find({ status: "active" }).select("name").sort({ name: 1 }).lean();
    const names = list.map((d) => d.name);

    // Also get distinct designations used in Employee collection
    const empDesigs = await Employee.distinct("designation", { status: "active" });
    const allSet = new Set([...names, ...empDesigs].filter(Boolean));
    return Array.from(allSet).sort();
  } catch (err) {
    return [];
  }
}

async function getEmployeesByDesignation(designation) {
  try {
    const query = { status: "active" };
    if (designation && designation !== "all") {
      query.designation = { $regex: new RegExp(`^${designation.trim()}$`, "i") };
    }

    return await Employee.find(query)
      .select("_id name employeeId designation branch")
      .populate("branch", "name")
      .sort({ name: 1 })
      .lean();
  } catch (err) {
    return [];
  }
}

module.exports = {
  create,
  findMyRaised,
  findAssignedToMe,
  findAll,
  findById,
  updateStatus,
  update,
  remove,
  getDesignations,
  getEmployeesByDesignation,
};

