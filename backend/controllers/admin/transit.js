const transitModel = require("../../models/transit");
const salesModel = require("../../models/sales");

exports.findTransitData = async (req, res) => {
    try {
        let query = req.body || {};
        const findData = await transitModel.find(query)
            .populate('branch', 'branchName branchId address city state')
            .populate('proof')
            .populate('receivedProof')
            .populate('storeProof')
            .populate('adminProof')
            .populate('storeReceivedBy', 'username')
            .populate('adminReceivedBy', 'username')
            .populate({
                path: 'saleIds',
                populate: [
                  { path: 'customer', select: 'name' },
                  { path: 'branch', select: 'branchName branchId' }
                ]
            })
            .sort({ createdAt: -1 });
        const transitIds = findData.map(t => t._id);
        const meltingModel = require('../../models/melting');
        const meltBatches = await meltingModel.find({ transitIds: { $in: transitIds } }).lean().exec();
        const meltBatchMap = {};
        meltBatches.forEach(mb => {
            (mb.transitIds || []).forEach(tid => {
                const key = String(tid);
                if (!meltBatchMap[key] || ['melt_updated', 'sold'].includes(mb.status)) {
                    meltBatchMap[key] = mb;
                }
            });
        });

        const formattedData = findData.map(item => {
            const doc = item.toObject();
            const meltBatch = meltBatchMap[String(doc._id)];
            const meltBatchCompleted = meltBatch && (meltBatch.status === 'melt_updated' || meltBatch.status === 'sold');

            let totalOrns = 0;
            let meltedOrns = 0;
            if (doc.saleIds && Array.isArray(doc.saleIds)) {
                doc.saleIds.forEach(sale => {
                    if (sale && sale.ornaments && Array.isArray(sale.ornaments)) {
                        totalOrns += sale.ornaments.length;
                        meltedOrns += sale.ornaments.filter(o => o.status === 'melted').length;
                    }
                });
            }
            // Only mark melted if melt batch is actually completed
            if (doc.status === 'melted' || (meltBatchCompleted && totalOrns > 0 && meltedOrns === totalOrns)) {
                doc.isMelted = true;
                doc.meltingStatus = 'melted';
            } else if (meltedOrns > 0) {
                doc.isMelted = false;
                doc.meltingStatus = 'partial';
            } else {
                doc.isMelted = false;
                doc.meltingStatus = 'unmelted';
            }
            doc.meltRecord = meltBatch || null;
            return doc;
        });

        res.json({
            status: true,
            message: "",
            data: formattedData
        });
    } catch (err) {
        res.json({
            status: false,
            message: err.message,
            data: {}
        });
    }
};

exports.updateTransitStatus = async (req, res) => {
    try {
        const {
            status,
            deviations,
            receivedNotes,
            receivedProof,
            action,
            storeNotes,
            storeProof,
            adminNotes,
            adminProof
        } = req.body;

        const updatePayload = {};
        const userType = req.user?.userType?.toLowerCase();

        if (action === 'store_receive' || userType === 'store') {
            // Store receipt flow
            const finalDeviations = deviations || 'no';
            const finalStatus = finalDeviations === 'yes' ? 'submitted' : 'moved';
            const proofId = storeProof || receivedProof;
            const notes = storeNotes || receivedNotes || "";

            updatePayload.status = finalStatus;
            updatePayload.deviations = finalDeviations;
            updatePayload.storeDeviations = finalDeviations;
            updatePayload.storeReceived = true;
            updatePayload.storeReceivedAt = new Date();
            updatePayload.storeReceivedBy = req.user?._id;
            updatePayload.storeNotes = notes;
            updatePayload.receivedNotes = notes;
            if (proofId) {
                updatePayload.storeProof = proofId;
                updatePayload.receivedProof = proofId;
            }

            const storeLogEntry = {
                actionBy: req.user?._id,
                userType: 'store',
                action: 'store_receive',
                deviation: finalDeviations,
                status: finalStatus,
                notes: notes || '',
                proof: proofId || null,
                createdAt: new Date()
            };

            const updateData = await transitModel.findByIdAndUpdate(
                req.params.id,
                {
                    $set: updatePayload,
                    $push: { deviationLogs: storeLogEntry }
                },
                { new: true }
            );

            // If deviations is 'no', sales are immediately moved
            if (finalStatus === 'moved') {
                await salesModel.updateMany(
                    { _id: { $in: updateData.saleIds } },
                    { status: 'moved' }
                );
            }

            return res.json({
                status: true,
                message: finalDeviations === 'yes' 
                    ? "Transit received in store with deviation flagged (Pending Admin review)" 
                    : "Transit received and moved into store successfully",
                data: updateData
            });
        } else if (action === 'admin_resolve' || (userType === 'admin' && req.body.adminResolve)) {
            // Admin deviation review flow
            const finalDeviations = req.body.deviations || deviations || 'no';
            const finalStatus = finalDeviations === 'yes' ? 'submitted' : 'moved';

            updatePayload.status = finalStatus;
            updatePayload.deviations = finalDeviations;
            updatePayload.adminReceivedAt = new Date();
            updatePayload.adminReceivedBy = req.user?._id;
            if (adminNotes) updatePayload.adminNotes = adminNotes;
            if (adminProof) updatePayload.adminProof = adminProof;

            const adminLogEntry = {
                actionBy: req.user?._id,
                userType: 'admin',
                action: 'admin_review',
                deviation: finalDeviations,
                status: finalStatus,
                notes: adminNotes || '',
                proof: adminProof || null,
                createdAt: new Date()
            };

            const updateData = await transitModel.findByIdAndUpdate(
                req.params.id,
                {
                    $set: updatePayload,
                    $push: { deviationLogs: adminLogEntry }
                },
                { new: true }
            );

            // Only when deviation is cleared (No) does transit sales status move to 'moved'
            if (finalStatus === 'moved') {
                await salesModel.updateMany(
                    { _id: { $in: updateData.saleIds } },
                    { status: 'moved' }
                );
            }

            return res.json({
                status: true,
                message: finalDeviations === 'yes'
                    ? "Transit kept as active deviation (Pending resolution)"
                    : "Deviation resolved to 'No' and transit approved into store successfully",
                data: updateData
            });
        }

        // Generic update fallback
        if (status) updatePayload.status = status;
        if (deviations) updatePayload.deviations = deviations;
        if (receivedNotes) updatePayload.receivedNotes = receivedNotes;
        if (receivedProof) updatePayload.receivedProof = receivedProof;

        const updateData = await transitModel.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true }
        );
        
        if (status === 'moved') {
            await salesModel.updateMany(
                { _id: { $in: updateData.saleIds } },
                { status: 'moved' }
            );
        }

        res.json({
            status: true,
            message: "Transit status updated successfully",
            data: updateData
        });
    } catch (err) {
        res.json({
            status: false,
            message: err.message,
            data: {}
        });
    }
};

exports.deleteTransitData = async (req, res) => {
    try {
        const transit = await transitModel.findById(req.params.id);
        if (transit && transit.saleIds && transit.saleIds.length > 0) {
            await salesModel.updateMany({ _id: { $in: transit.saleIds } }, { status: 'bullion pending' });
        }
        const deleteData = await transitModel.findByIdAndDelete(req.params.id);
        res.json({
            status: true,
            message: "Transit deleted successfully",
            data: deleteData
        });
    } catch (err) {
        res.json({
            status: false,
            message: err.message,
            data: {}
        });
    }
};

exports.getTransitSales = async (req, res) => {
    try {
        const transit = await transitModel.findById(req.params.id)
            .populate('branch', 'branchName branchId address city state')
            .populate('proof')
            .populate('storeProof')
            .populate('adminProof')
            .populate('storeReceivedBy', 'username')
            .populate('adminReceivedBy', 'username')
            .populate({
                path: 'deviationLogs.actionBy',
                select: 'username employee',
                populate: { path: 'employee', select: 'firstName lastName employeeId' }
            })
            .populate('deviationLogs.proof')
            .populate({
                path: 'saleIds',
                populate: [
                    { path: 'customer' },
                    { path: 'branch' },
                    { path: 'assignee' }
                ]
            });
            
        if (!transit) {
            return res.json({ status: false, message: "Transit not found", data: [], transit: null });
        }

        const transitDoc = transit.toObject();
        let totalOrns = 0;
        let meltedOrns = 0;
        if (transitDoc.saleIds && Array.isArray(transitDoc.saleIds)) {
            transitDoc.saleIds.forEach(sale => {
                if (sale && sale.ornaments && Array.isArray(sale.ornaments)) {
                    totalOrns += sale.ornaments.length;
                    meltedOrns += sale.ornaments.filter(o => o.status === 'melted').length;
                }
            });
        }
        if (transitDoc.status === 'melted' || (totalOrns > 0 && meltedOrns === totalOrns)) {
            transitDoc.isMelted = true;
            transitDoc.meltingStatus = 'melted';
        } else if (meltedOrns > 0) {
            transitDoc.isMelted = false;
            transitDoc.meltingStatus = 'partial';
        } else {
            transitDoc.isMelted = false;
            transitDoc.meltingStatus = 'unmelted';
        }

        res.json({
            status: true,
            message: "Sales fetched successfully",
            data: transit.saleIds || [],
            transit: transitDoc
        });
    } catch (err) {
        res.json({
            status: false,
            message: err.message,
            data: [],
            transit: null
        });
    }
};
