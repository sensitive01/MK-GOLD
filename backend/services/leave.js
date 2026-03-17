const Leave = require("../models/leave");

async function find(query = {}) {
  try {
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
      const User = require("../models/user");
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
    return await leave.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Leave.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
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
