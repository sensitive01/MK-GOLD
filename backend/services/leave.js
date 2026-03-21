const Leave = require("../models/leave");
const User = require("../models/user");
const { sendEmail } = require("./mailer");

async function find(query = {}, user = null) {
  try {
    if (user && user.userType?.toLowerCase() === "branch") {
      query.branch = user.branch?._id || user.branch;
    } else if (user && user.userType?.toLowerCase() === "hr") {
      // HR only sees leaves already approved by BM
      query.bmStatus = "approved";
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

async function create(payload) {
  try {
    // If branch is missing, null, or empty string, try to find it from the employee's user profile
    if ((!payload.branch || payload.branch === "" || payload.branch === "null") && payload.employee) {
      const user = await User.findOne({ employee: payload.employee }).exec();
      if (user && user.branch) {
        payload.branch = user.branch;
      }
    }
    
    // Clean up branch field if it's still an empty string or invalid to avoid Mongoose validation errors
    if (payload.branch === "" || payload.branch === "null") {
      delete payload.branch;
    }

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

async function update(id, payload) {
  try {
    const previousLeave = await Leave.findById(id).populate("branch").populate("employee");
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
