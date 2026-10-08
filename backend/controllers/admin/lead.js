const service = require('../../services/lead');

async function find(req, res) {
  try {
    const data = await service.find(req.query);
    res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    if (req.user) {
      req.body.createdBy = req.user._id;
    }
    if (req.files && req.files.length > 0) {
      let docTypes = [];
      if (req.body.documentTypes) {
        docTypes = Array.isArray(req.body.documentTypes) ? req.body.documentTypes : [req.body.documentTypes];
      }
      req.body.documents = req.files.map((f, idx) => ({
        documentType: docTypes[idx] || 'Document',
        documentFile: f.path,
        uploadedBy: req.user?._id,
        uploadedAt: new Date(),
      }));
      req.body.attachment = req.files[0].path;
    }
    const data = await service.create(req.body);
    res.json({ status: true, data, message: 'Created successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    let existingDocs = [];
    if (req.body.existingDocuments) {
      try {
        existingDocs = typeof req.body.existingDocuments === 'string'
          ? JSON.parse(req.body.existingDocuments)
          : req.body.existingDocuments;
      } catch (e) {
        existingDocs = [];
      }
    }

    let newDocs = [];
    if (req.files && req.files.length > 0) {
      let docTypes = [];
      if (req.body.documentTypes) {
        docTypes = Array.isArray(req.body.documentTypes) ? req.body.documentTypes : [req.body.documentTypes];
      }
      newDocs = req.files.map((f, idx) => ({
        documentType: docTypes[idx] || 'Document',
        documentFile: f.path,
        uploadedBy: req.user?._id,
        uploadedAt: new Date(),
      }));
    }

    if (req.body.existingDocuments !== undefined || (req.files && req.files.length > 0)) {
      req.body.documents = [...existingDocs, ...newDocs];
    }

    const data = await service.update(req.params.id, req.body);
    res.json({ status: true, data, message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ status: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

module.exports = { find, create, update, remove };
