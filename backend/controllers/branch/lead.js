const leadService = require("../../services/lead");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  try {
    const data = await leadService.find(req.body ?? {}, req.user);
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findById(req, res) {
  try {
    const data = await leadService.findById(req.params.id);
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function create(req, res) {
  try {
    if (req.user) {
      req.body.branch = req.user.branch?._id || req.user.branch;
      req.body.createdBy = req.user._id;
    }
    const createdData = await leadService.create(req.body);
    res.json({
      status: true,
      message: "Lead created successfully!",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "lead" },
      },
    });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function update(req, res) {
  try {
    const data = await leadService.update(req.params.id, req.body);
    res.json({ status: true, message: "Lead updated successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    await fileUploadService.removeMany({
      uploadId: { $in: req.params.id.split(",") },
      uploadName: "lead",
    });
    await leadService.remove(req.params.id);
    res.json({ status: true, message: "Lead deleted successfully!", data: {} });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function addDisposition(req, res) {
  try {
    if (req.user) {
      req.body.createdBy = req.user._id;
    }
    const data = await leadService.addDisposition(req.params.id, req.body);
    res.json({ status: true, message: "Call log added successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function getStats(req, res) {
  try {
    const data = await leadService.getLeadStats(req.user);
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}
async function bulkCreate(req, res) {
  try {
    const leads = req.body.leads;
    if (!Array.isArray(leads)) {
      return res.json({ status: false, message: "Invalid payload format", data: {} });
    }

    // Attach branch and createdBy if available
    const enrichedLeads = leads.map(lead => {
      if (req.user) {
        lead.branch = req.user.branch?._id || req.user.branch;
        lead.createdBy = req.user._id;
      }
      return lead;
    });

    const createdData = await leadService.bulkCreate(enrichedLeads);

    let message = `${createdData.insertedCount} leads imported successfully!`;
    if (createdData.duplicateCount > 0) {
      if (createdData.insertedCount === 0) {
        message = `No new leads imported. ${createdData.duplicateCount} duplicate leads were found and skipped.`;
      } else {
        message = `${createdData.insertedCount} leads imported successfully! (${createdData.duplicateCount} duplicate leads skipped).`;
      }
    }

    res.json({
      status: true,
      message: message,
      data: createdData.insertedLeads,
    });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = { find, findById, create, bulkCreate, update, remove, addDisposition, getStats };
