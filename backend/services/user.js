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
    return await User.find(query)
      .populate("employee")
      .populate("branch")
      .select("-password")

      .sort({ createdAt: -1 })
      .exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await User.findById(id).populate("employee").populate("branch").select("-password").exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new User(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    const user = await User.findById(id);
    if (!user) throw new Error("User not found");
    
    // Explicitly update fields from payload
    Object.assign(user, payload);
    
    // Trigger save() to fire the pre('save') bcrypt hook in models/user.js
    return await user.save();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await User.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, update, remove };
