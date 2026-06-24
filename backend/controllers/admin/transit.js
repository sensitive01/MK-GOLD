const transitModel = require("../../models/transit");
const salesModel = require("../../models/sales");

exports.findTransitData = async (req, res) => {
    try {
        let query = req.body || {};
        const findData = await transitModel.find(query)
            .populate('branch', 'branchName branchId address city state')
            .populate('proof')
            .populate('receivedProof')
            .populate({
                path: 'saleIds',
                populate: [
                  { path: 'customer', select: 'name' },
                  { path: 'branch', select: 'branchName branchId' }
                ]
            })
            .sort({ createdAt: -1 });
        res.json({
            status: true,
            message: "",
            data: findData
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
        const { status, deviations, receivedNotes, receivedProof } = req.body;
        const updatePayload = { status };
        if (deviations) updatePayload.deviations = deviations;
        if (receivedNotes) updatePayload.receivedNotes = receivedNotes;
        if (receivedProof) updatePayload.receivedProof = receivedProof;

        const updateData = await transitModel.findByIdAndUpdate(
            req.params.id,
            updatePayload,
            { new: true }
        );
        
        // Update the sales status to 'moved' when transit is received
        if (status === 'submitted' || status === 'moved') {
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
