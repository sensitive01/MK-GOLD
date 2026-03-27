const Leave = require("../models/leave");
const User = require("../models/user");
const Employee = require("../models/employee");
const { sendEmail } = require("./mailer");

async function find(query = {}, user = null) {
  try {
    const type = user?.userType?.toLowerCase();
    if (["branch", "assistant_branch_manager", "branch_executive", "telecalling", "finance", "accounts", "operations"].includes(type)) {
      const bId = user.branch?._id || user.branch;
      if (bId) {
        query.branch = bId;
      }
      // If it's a sub-role (employee), only show their own leaves
      if (type !== "branch") {
        query.employee = user.employee?._id || user.employee;
      }
    } else if (type === "hr") {
      // HR can see all leaves.
    }

    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"]).toISOString().replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"]).toISOString().replace(/T.*Z/, "T23:59:59Z")
      );
    }
    return await Leave.find(query)
      .populate("employee")
      .populate("branch")
      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await Leave.findById(id)
      .populate("employee")
      .populate("branch")
      .exec();
  } catch (err) {
    throw err;
  }
}

// Helper to get employee name from user object
async function _getPerformerName(user) {
  try {
    if (user?.employee) {
      const empId = user.employee?._id || user.employee;
      const emp = await Employee.findById(empId);
      return emp?.name || "Unknown";
    }
    return "System";
  } catch {
    return "Unknown";
  }
}

async function create(payload, user = null) {
  try {
    // If branch is missing, null, or empty string, try to find it from the employee's user profile
    if ((!payload.branch || payload.branch === "" || payload.branch === "null") && payload.employee) {
      // Try to find branch from User record first
      const userRecord = await User.findOne({ employee: payload.employee }).exec();
      if (userRecord && userRecord.branch) {
        payload.branch = userRecord.branch;
      } else {
        // Fallback: Try to find branch from Employee record directly
        const empRecord = await Employee.findById(payload.employee).exec();
        if (empRecord && empRecord.branch) {
          payload.branch = empRecord.branch;
        }
      }
    }
    
    // Clean up branch field if it's still an empty string or invalid to avoid Mongoose validation errors
    if (payload.branch === "" || payload.branch === "null") {
      delete payload.branch;
    }

    // Add 'requested' action log entry
    const performerName = user ? await _getPerformerName(user) : "Unknown";
    const performerId = user?.employee?._id || user?.employee || null;
    const performerRole = user?.userType || "unknown";

    payload.actionLog = [
      {
        action: "requested",
        performedBy: performerId,
        performedByName: performerName,
        role: performerRole,
        performedAt: new Date(),
      },
    ];

    let leave = new Leave(payload);
    const createdLeave = await leave.save();
    const populated = await Leave.findById(createdLeave._id).populate("employee").populate("branch");

    // NOTIFY BRANCH MANAGER
    if (populated.branch) {
        const managerUser = await User.findOne({ branch: populated.branch, userType: 'branch' }).populate('employee');
        if (managerUser && managerUser.employee && managerUser.employee.email) {
            const subject = "New Leave Application - " + populated.employee.name;
            const body = `Employee ${populated.employee.name} has applied for leave. Note: ${populated.note}. Link: http://localhost:3000/dashboard/leave`;
            await sendEmail(managerUser.employee.email, subject, body);
        }
    }

    return createdLeave;
  } catch (err) {
    throw err;
  }
}

async function update(id, payload, user = null) {
  try {
    const previousLeave = await Leave.findById(id).populate("branch").populate("employee");

    // Build action log entry based on what changed
    let logAction = null;
    if (payload.bmStatus && payload.bmStatus !== previousLeave.bmStatus) {
      logAction = payload.bmStatus === "approved" ? "bm_approved" : "bm_rejected";
    }
    if (payload.hrStatus && payload.hrStatus !== previousLeave.hrStatus) {
      logAction = payload.hrStatus === "approved" ? "hr_approved" : "hr_rejected";
    }
    if (payload.status && payload.status !== previousLeave.status && !logAction) {
      logAction = payload.status; // approved / rejected
    }

    // Push action log if there's a meaningful action
    if (logAction && user) {
      const performerName = await _getPerformerName(user);
      const performerId = user?.employee?._id || user?.employee || null;
      const performerRole = user?.userType?.toLowerCase() || "unknown";

      // If overall status is being set to approved/rejected, also set hrStatus if not present in payload
      if (payload.status && !payload.hrStatus && ["admin", "hr"].includes(performerRole)) {
        payload.hrStatus = payload.status;
      }

      if (!payload.$push) payload.$push = {};
      payload.$push.actionLog = {
        action: logAction,
        performedBy: performerId,
        performedByName: performerName,
        role: performerRole,
        performedAt: new Date(),
      };
    }

    const updatedLeave = await Leave.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).populate("branch").populate("employee").exec();

    // NOTIFY HR IF BM APPROVED
    if (payload.bmStatus === "approved" && previousLeave.bmStatus !== "approved") {
        const hrUsers = await User.find({ userType: 'hr' }).populate('employee');
        for (const hr of hrUsers) {
            if (hr.employee && hr.employee.email) {
                const subject = "Leave Application (Branch Approved) - " + updatedLeave.employee.name;
                const body = `Branch Manager approved leave for ${updatedLeave.employee.name}. Final HR approval required. Link: http://localhost:3000/dashboard/leave`;
                await sendEmail(hr.employee.email, subject, body);
            }
        }
    }

    return updatedLeave;
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Leave.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, update, remove };
