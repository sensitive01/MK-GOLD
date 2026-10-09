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
    if (!payload.batchNumber || (typeof payload.batchNumber === 'string' && !payload.batchNumber.trim())) {
      payload.batchNumber = await service.generateUniqueBatchNumber();
    } else {
      const exists = await require('../../models/melting').exists({ batchNumber: payload.batchNumber });
      if (exists) {
        payload.batchNumber = await service.generateUniqueBatchNumber();
      }
    }

    // Defensive defaults
    payload.status = payload.status || 'created';
    payload.isPreMeltCompleted = payload.isPreMeltCompleted === true;
    if (!payload.transitId && payload.transitIds && payload.transitIds.length > 0) {
      payload.transitId = payload.transitIds[0];
    }
    if (payload.totalNetAmount === undefined || payload.totalNetAmount === null) {
      payload.totalNetAmount = (payload.ornaments || []).reduce((sum, o) => sum + (Number(o.netAmount) || 0), 0);
    }
    if (!payload.totalGrossWeight && payload.ornaments) {
      payload.totalGrossWeight = (payload.ornaments || []).reduce((sum, o) => sum + (Number(o.grossWeight) || 0), 0);
    }
    if (!payload.totalNetWeight && payload.ornaments) {
      payload.totalNetWeight = (payload.ornaments || []).reduce((sum, o) => sum + (Number(o.netWeight) || 0), 0);
    }
    if (!payload.totalOrnaments && payload.ornaments) {
      payload.totalOrnaments = (payload.ornaments || []).reduce((sum, o) => sum + (Number(o.quantity) || 1), 0);
    }
    if (!payload.meltProof && payload.proof) {
      payload.meltProof = payload.proof;
    }

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

    // Update transits status if transitIds provided
    if (payload.transitIds && payload.transitIds.length > 0) {
      const transitModel = require('../../models/transit');
      const { assignArticleNumbersToSales } = require('../../services/sales');

      const transitUpdatePayload = {
        status: 'moved_to_melting',
        isMovedToMelting: true,
        movedToMeltingAt: new Date(),
        movedToMeltingBy: req.user?._id,
      };

      const logEntry = {
        actionBy: req.user?._id,
        userType: req.user?.userType || 'store',
        action: 'move_to_melting',
        deviation: 'no',
        status: 'moved_to_melting',
        notes: payload.notes || `Moved from Store to Melting in Batch ${payload.batchNumber}`,
        createdAt: new Date(),
      };

      await transitModel.updateMany(
        { _id: { $in: payload.transitIds } },
        {
          $set: transitUpdatePayload,
          $push: { deviationLogs: logEntry },
        }
      );

      if (payload.saleIds && payload.saleIds.length > 0) {
        await assignArticleNumbersToSales(payload.saleIds);
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

async function getNextBatchNumber(req, res) {
  try {
    const batchNumber = await service.generateUniqueBatchNumber();
    res.json({ status: true, data: { batchNumber } });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

module.exports = { find, create, update, remove, getNextBatchNumber };
