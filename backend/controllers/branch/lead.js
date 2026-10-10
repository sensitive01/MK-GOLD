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
      const ut = req.user.userType?.toLowerCase();
      if (ut !== 'telecalling' && ut !== 'telecaller_tl' && ut !== 'telecaller-tl') {
        req.body.branch = req.user.branch?._id || req.user.branch;
      } else if (ut === 'telecalling') {
        req.body.assignedTo = req.user._id;
      }
      req.body.createdBy = req.user._id;
    }
    if (req.files && req.files.length > 0) {
      let docTypes = [];
      if (req.body.documentTypes) {
        docTypes = Array.isArray(req.body.documentTypes) ? req.body.documentTypes : [req.body.documentTypes];
      }
      req.body.documents = req.files.map((f, idx) => ({
        documentType: docTypes[idx] || "Document",
        documentFile: f.path,
        uploadedBy: req.user?._id,
        uploadedAt: new Date(),
      }));
      req.body.attachment = req.files[0].path;
    }
    const createdData = await leadService.create(req.body, req.user);
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
    let currentDocs = [];
    if (req.body.existingDocuments) {
      try {
        currentDocs = typeof req.body.existingDocuments === 'string' ? JSON.parse(req.body.existingDocuments) : req.body.existingDocuments;
      } catch (e) {
        currentDocs = [];
      }
    } else {
      const existing = await leadService.findById(req.params.id);
      currentDocs = existing?.documents || [];
    }

    if (req.files && req.files.length > 0) {
      let docTypes = [];
      if (req.body.documentTypes) {
        docTypes = Array.isArray(req.body.documentTypes) ? req.body.documentTypes : [req.body.documentTypes];
      }
      const newDocs = req.files.map((f, idx) => ({
        documentType: docTypes[idx] || "Document",
        documentFile: f.path,
        uploadedBy: req.user?._id,
        uploadedAt: new Date(),
      }));
      req.body.documents = [...currentDocs, ...newDocs];
      req.body.attachment = req.files[0].path;
    } else if (req.body.existingDocuments) {
      req.body.documents = currentDocs;
    }

    const data = await leadService.update(req.params.id, req.body, req.user);
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
    if (req.files && req.files.length > 0) {
      const hasUploadedFiles = req.files.some((f) => f.fieldname === 'uploadedFiles');
      const filesToUse = hasUploadedFiles
        ? req.files.filter((f) => f.fieldname === 'uploadedFiles')
        : req.files;

      let docTypes = [];
      if (req.body.documentTypes) {
        docTypes = Array.isArray(req.body.documentTypes) ? req.body.documentTypes : [req.body.documentTypes];
      }
      const documents = filesToUse.map((f, idx) => ({
        documentType: docTypes[idx] || 'Proof',
        documentFile: f.path,
      }));
      req.body.documents = documents;
      req.body.attachments = filesToUse.map((f) => f.path);
      req.body.attachment = filesToUse[0]?.path;
    } else if (req.file) {
      req.body.documents = [
        {
          documentType: req.body.documentType || 'Proof',
          documentFile: req.file.path,
        },
      ];
      req.body.attachments = [req.file.path];
      req.body.attachment = req.file.path;
    }
    const data = await leadService.addDisposition(req.params.id, req.body, req.user);
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
        const ut = req.user.userType?.toLowerCase();
        if (ut !== 'telecalling' && ut !== 'telecaller_tl' && ut !== 'telecaller-tl') {
          lead.branch = req.user.branch?._id || req.user.branch;
        }
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

async function markExclusive(req, res) {
  try {
    const { ids, isExclusive } = req.body;
    if (!ids || ids.length === 0) {
      return res.json({ status: false, message: "No leads selected", data: {} });
    }
    const data = await leadService.markExclusive(ids, isExclusive, req.user);
    res.json({ status: true, message: "Leads exclusivity updated successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function assignExecutive(req, res) {
  try {
    const data = await leadService.assignExecutive(req.params.id, req.body, req.user);
    res.json({ status: true, message: "Executive assigned successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function getBranchExecutives(req, res) {
  try {
    const data = await leadService.getBranchExecutives(req.params.branchId);
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function moveToBusiness(req, res) {
  try {
    const data = await leadService.moveToBusiness(req.params.id, req.user);
    res.json({ status: true, message: "Lead moved to business successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function tlApprove(req, res) {
  try {
    const data = await leadService.tlApprove(req.params.id, req.user);
    res.json({ status: true, message: "Lead approved and moved to Bullion Desk successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function tlReject(req, res) {
  try {
    const data = await leadService.tlReject(req.params.id, req.body.reason || "", req.user);
    res.json({ status: true, message: "Lead rejected successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function bullionApprove(req, res) {
  try {
    const data = await leadService.bullionApprove(req.params.id, req.user);
    res.json({ status: true, message: "Lead approved by Bullion Desk successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function bullionReject(req, res) {
  try {
    const data = await leadService.bullionReject(req.params.id, req.body.reason || "", req.user);
    res.json({ status: true, message: "Lead rejected by Bullion Desk successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = {
  find,
  findById,
  create,
  bulkCreate,
  update,
  remove,
  addDisposition,
  getStats,
  markExclusive,
  assignExecutive,
  getBranchExecutives,
  moveToBusiness,
  tlApprove,
  tlReject,
  bullionApprove,
  bullionReject,
};
