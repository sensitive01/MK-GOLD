const GoldRate = require("../models/goldrate");

async function find(query = {}) {
  try {
    if (query.date) {
      if (typeof query.date == "object") {
        if ("$gte" in query.date) {
          query.date["$gte"] = new Date(
            new Date(query.date["$gte"])
              .toISOString()
              .replace(/T.*Z/, "T00:00:00Z")
          );
        }
        if ("$lte" in query.date) {
          query.date["$lte"] = new Date(
            new Date(query.date["$lte"])
              .toISOString()
              .replace(/T.*Z/, "T23:59:59Z")
          );
        }
      } else {
        query.date = {
          $gte: new Date(
            new Date(query.date).toISOString().replace(/T.*Z/, "T00:00:00Z")
          ),
          $lte: new Date(
            new Date(query.date).toISOString().replace(/T.*Z/, "T23:59:59Z")
          ),
        };
      }
    }
    if (query.state) {
      query.state = { $regex: new RegExp(`^${query.state}$`, "i") };
    }
    return await GoldRate.find(query).sort({ createdAt: -1 }).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await GoldRate.findById(id).exec();
  } catch (err) {
    throw err;
  }
}

async function findOne(query) {
  try {
    if (query.date) {
      query.date = {
        $gte: new Date(new Date(query.date).toISOString().replace(/T.*Z/, "T00:00:00Z")),
        $lte: new Date(new Date(query.date).toISOString().replace(/T.*Z/, "T23:59:59Z")),
      };
    }
    if (query.state) {
      query.state = { $regex: new RegExp(`^${query.state}$`, "i") };
    }
    return await GoldRate.findOne(query).sort({ createdAt: -1 }).exec();
  } catch (err) {
    throw err;
  }
}

async function latest(query) {
  try {
    return await GoldRate.findOne(query).sort({ createdAt: -1 }).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    if (payload.date) {
      if (typeof payload.date === "number" || payload.date instanceof Date) {
        const d = new Date(payload.date);
        const istDate = new Date(d.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
        payload.date = new Date(istDate);
      }
    }
    let goldRate = new GoldRate(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await GoldRate.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await GoldRate.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  findOne,
  latest,
  create,
  update,
  remove,
};
