const QREnquiry = require("../models/qrEnquiry");

async function generateEnqId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  
  let isUnique = false;
  let finalId = "";

  while (!isUnique) {
    // Generate 3 random numbers and 1 random letter
    let parts = [];
    for (let i = 0; i < 3; i++) parts.push(nums[Math.floor(Math.random() * nums.length)]);
    parts.push(chars[Math.floor(Math.random() * chars.length)]);

    // Shuffle them
    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }

    finalId = "ENQ" + parts.join("");

    // Check uniqueness
    const existing = await QREnquiry.findOne({ enqID: finalId });
    if (!existing) isUnique = true;
  }

  return finalId;
}

async function find(query = {}) {
  const Employee = require("../models/employee");
  const User = require("../models/user");

  const enquiries = await QREnquiry.find(query).populate("branch").sort({ createdAt: -1 }).lean().exec();

  for (const enq of enquiries) {
    if (enq.actionLog && Array.isArray(enq.actionLog)) {
      for (const log of enq.actionLog) {
        if (log.performedBy) {
          try {
            let performer = await Employee.findById(log.performedBy).select("name employeeId").lean().exec();
            if (!performer) {
              performer = await User.findById(log.performedBy).select("username").lean().exec();
              if (performer) {
                log.performerName = { name: performer.username, employeeId: "ADMIN-USER" };
              } else {
                log.performerName = { name: "Staff", employeeId: "UNKNOWN" };
              }
            } else {
              log.performerName = { name: performer.name, employeeId: performer.employeeId };
            }
          } catch (e) {
            log.performerName = { name: "Staff", employeeId: "ERROR" };
          }
        }
      }
    }
  }

  return enquiries;
}

async function findOne(query = {}) {
  const Employee = require("../models/employee");
  const User = require("../models/user");

  const enq = await QREnquiry.findOne(query).populate("branch").lean().exec();

  if (enq && enq.actionLog && Array.isArray(enq.actionLog)) {
    for (const log of enq.actionLog) {
      if (log.performedBy) {
        try {
          let performer = await Employee.findById(log.performedBy).select("name employeeId").lean().exec();
          if (!performer) {
            performer = await User.findById(log.performedBy).select("username").lean().exec();
            if (performer) {
              log.performerName = { name: performer.username, employeeId: "ADMIN-USER" };
            } else {
              log.performerName = { name: "Staff", employeeId: "UNKNOWN" };
            }
          } else {
            log.performerName = { name: performer.name, employeeId: performer.employeeId };
          }
        } catch (e) {
          log.performerName = { name: "Staff", employeeId: "ERROR" };
        }
      }
    }
  }

  return enq;
}

async function create(payload) {
  const enqId = await generateEnqId();
  payload.enqID = enqId;
  payload.actionLog = [{ action: "Enquiry Raised", performedAt: new Date() }];
  const enquiry = new QREnquiry(payload);
  return await enquiry.save();
}

module.exports = { find, create, findOne };
