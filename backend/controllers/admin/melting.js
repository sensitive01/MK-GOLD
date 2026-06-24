const service = require('../../services/melting');

async function find(req, res) {
  try {
    const data = await service.find(req.body || {});
    res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

const salesModel = require('../../models/sales');

async function create(req, res) {
  try {
    const payload = req.body;
    payload.createdBy = req.user?._id;
    const data = await service.create(payload);

    // Update sales status for the selected ornaments
    if (payload.ornaments && payload.ornaments.length > 0) {
        let affectedSaleIds = [];
        for (let orn of payload.ornaments) {
            await salesModel.updateOne(
                { _id: orn.saleId, "ornaments._id": orn.ornamentId },
                { $set: { "ornaments.$.status": "melted" } }
            );
            if (!affectedSaleIds.includes(orn.saleId)) affectedSaleIds.push(orn.saleId);
        }
        
        // Check and update sale status if all ornaments are melted
        for (let saleId of affectedSaleIds) {
            const sale = await salesModel.findById(saleId);
            if (sale && sale.ornaments) {
                const allMelted = sale.ornaments.every(o => o.status === 'melted');
                if (allMelted) {
                    await salesModel.updateOne({ _id: saleId }, { $set: { status: 'melted' } });
                }
            }
        }
    }

    res.json({ status: true, data, message: 'Created successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const data = await service.update(req.params.id, req.body);
    res.json({ status: true, data, message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    const melt = await require('../../models/melting').findById(req.params.id);
    if (melt && melt.ornaments && melt.ornaments.length > 0) {
        let affectedSaleIds = [];
        for (let orn of melt.ornaments) {
            await salesModel.updateOne(
                { _id: orn.saleId, "ornaments._id": orn.ornamentId },
                { $unset: { "ornaments.$.status": "" } }
            );
            if (!affectedSaleIds.includes(orn.saleId)) affectedSaleIds.push(orn.saleId);
        }
        
        // Revert sale status if it was melted
        for (let saleId of affectedSaleIds) {
            await salesModel.updateOne({ _id: saleId }, { $set: { status: 'intransit' } });
        }
    }
    await service.remove(req.params.id);
    res.json({ status: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

module.exports = { find, create, update, remove };
