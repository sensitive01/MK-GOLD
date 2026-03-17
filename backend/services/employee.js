const Employee = require("../models/employee");
const User = require("../models/user");

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
    return await Employee.find(query).sort({ createdAt: -1 }).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await Employee.findById(id).exec();
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
          gender: 1,
          designation: 1,
          status: 1,
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
