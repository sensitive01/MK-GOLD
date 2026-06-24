const service = require('../../services/vendor');

async function find(req, res) {
  try {
    const data = await service.find(req.body || {});
    res.json({ status: true, data });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function findById(req, res) {
  try {
    const data = await service.findById(req.params.id);
    res.json({ status: true, data });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const payload = req.body;
    payload.createdBy = req.user?._id;
    
    // Simple unique check for phone
    const existing = await service.find({ phoneNumber: payload.phoneNumber });
    if (existing && existing.length > 0) {
      return res.json({ status: false, message: "Vendor with this phone number already exists." });
    }

    const data = await service.create(payload);
    res.json({ status: true, data, message: 'Vendor created successfully' });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    // Check for phone number conflicts on update
    if (req.body.phoneNumber) {
      const existing = await service.find({ phoneNumber: req.body.phoneNumber, _id: { $ne: req.params.id } });
      if (existing && existing.length > 0) {
        return res.json({ status: false, message: "Another vendor with this phone number already exists." });
      }
    }
    const data = await service.update(req.params.id, req.body);
    res.json({ status: true, data, message: 'Vendor updated successfully' });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ status: true, message: 'Vendor deleted successfully' });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

module.exports = { find, findById, create, update, remove };
