const Employee = require("../models/employee");
const User = require("../models/user");
const mongoose = require("mongoose");

async function find(query = {}, user = null) {
  try {
    const type = user?.userType?.toLowerCase() || '';
    const isBranchRole = [
      "branch", 
      "assistant_branch_manager", 
      "branch_executive", 
      "transaction_executive", 
      "telecalling",
      "bullion_desk"
    ].some(role => type.includes(role));

    if (isBranchRole) {
      query.branch = user.branch?._id || user.branch;
      
      // Only restrict to self for non-management/non-sales roles if needed, 
      // but for now, allow branch roles to see branch employees.
      // (Removed the restrict-to-self logic for these branch roles)
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
    const mongoose = require("mongoose");
    if (query.branch && typeof query.branch === "string") {
      query.branch = mongoose.Types.ObjectId(query.branch);
    }
    return await Employee.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "employee",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { branch: query.branch },
            { "user.branch": query.branch },
            { branch: query.branch?.toString() },
            { "user.branch": query.branch?.toString() }
          ]
        }
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branchDetails",
        },
      },
      { $unwind: { path: "$branchDetails", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          name: 1,
          email: 1,
          gender: 1,
          designation: 1,
          phoneNumber: 1,
          status: 1,
          createdAt: 1,
          userType: "$user.userType",
          branchName: "$branchDetails.name",
          lastEditedBy: "$lastEditedBy",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "lastEditedBy",
          foreignField: "_id",
          as: "lastEditedBy",
        },
      },
      {
        $unwind: {
          path: "$lastEditedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    const data = await Employee.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "users",
          localField: "lastEditedBy",
          foreignField: "_id",
          as: "lastEditedBy",
        },
      },
      {
        $unwind: {
          path: "$lastEditedBy",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "lastEditedBy.employee",
          foreignField: "_id",
          as: "lastEditedBy.employeeDetails",
        },
      },
      {
        $unwind: {
          path: "$lastEditedBy.employeeDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $limit: 1 }
    ]).exec();
    return data[0] ?? {};
  } catch (err) {
    throw err;
  }
}

async function findByBranchId(id) {
  try {
    return await User.aggregate([
      { $match: { username: id } },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      { $unwind: "$employee" },
      {
        $project: {
          _id: "$employee._id",
          employeeId: "$employee.employeeId",
          name: "$employee.name",
          gender: "$employee.gender",
          dob: "$employee.dob",
          phoneNumber: "$employee.phoneNumber",
          alternatePhoneNumber: "$employee.alternatePhoneNumber",
          designation: "$employee.designation",
          status: "$employee.status",
          address: "$employee.address",
          doj: "$employee.doj",
          employmentType: "$employee.employmentType",
          languages: "$employee.languages",
          createdAt: "$employee.createdAt",
          updatedAt: "$employee.updatedAt",
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findAllWithBranch() {
  try {
    return await Employee.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "employee",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          name: 1,
          branch: "$user.branch",
          email: 1,
          phoneNumber: 1,
          gender: 1,
          designation: 1,
          doj: 1,
          employmentType: 1,
          languages: 1,
          status: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function aggregate(query = {}) {
  try {
    return await Employee.aggregate(query).exec();
  } catch (err) {
    throw err;
  }
}

async function count(query = {}) {
  try {
    if (query.createdAt) {
      query.createdAt = new Date(query.createdAt).toISOString();
      query.createdAt = {
        $gte: new Date(query.createdAt.replace(/T.*Z/, "T00:00:00Z")),
        $lte: new Date(query.createdAt.replace(/T.*Z/, "T23:59:59Z")),
      };
    }
    return await Employee.count(query);
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new Employee(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Employee.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Employee.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function getNextEmployeeId() {
  try {
    let isUnique = false;
    let nextId = "";
    while (!isUnique) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
      nextId = "MKG" + randomDigits;
      const existingEmployee = await Employee.findOne({ employeeId: nextId }).exec();
      if (!existingEmployee) {
        isUnique = true;
      }
    }
    return nextId;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  findByBranchId,
  aggregate,
  count,
  create,
  update,
  remove,
  findAllWithBranch,
  getNextEmployeeId,
};
