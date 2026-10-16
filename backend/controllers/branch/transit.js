const transitModel = require("../../models/transit")
const salesModel = require("../../models/sales")
const { assignArticleNumbersToSales } = require("../../services/sales")

exports.createTransitData = async (req,res)=>{
    try{
        const isCreatedByStore =
            req.body.creatorType === 'store' ||
            req.user?.userType === 'store' ||
            req.body.status === 'moved' ||
            String(req.body.createdBy).toLowerCase() === 'store';

        let payload = { ...req.body };
        if (isCreatedByStore) {
            payload.status = 'moved';
            payload.storeReceived = true;
            payload.storeReceivedAt = new Date();
            payload.storeReceivedBy = req.user?._id || req.body.createdBy;
            if (req.body.proof) {
                payload.storeProof = req.body.proof;
            }
            payload.storeNotes = req.body.notes || "Direct Store Entry";
            payload.storeDeviations = 'no';
            payload.deviations = 'no';
            payload.deviationLogs = [
                {
                    actionBy: req.user?._id || req.body.createdBy,
                    userType: 'store',
                    action: 'store_create_and_receive',
                    deviation: 'no',
                    status: 'moved',
                    notes: req.body.notes || 'Direct Store Entry',
                    proof: req.body.proof || null,
                    createdAt: new Date()
                }
            ];
        }

        const createData = await transitModel.create(payload);
        // Update the corresponding sales' statuses
        if (payload.saleIds && payload.saleIds.length > 0) {
            const saleStatus = isCreatedByStore ? 'moved' : 'intransit';
            await salesModel.updateMany({ _id: { $in: payload.saleIds } }, { status: saleStatus });
            if (isCreatedByStore) {
                await assignArticleNumbersToSales(payload.saleIds);
            }
        }
        
        res.json({
            status:true,
            message: isCreatedByStore ? "Transit created and moved into Store custody" : "",
            data:createData
        })
    }catch(err){
        res.json({
            status:false,
            message:err.message,
            data:{}
        })
    }
}

exports.batchCreateTransitData = async (req, res) => {
    try {
        const {
            saleIds = [],
            deliveryBy,
            transitMovedThrough = "Hand Delivery",
            notes = "",
            proof,
            createdBy,
            creatorType,
            status: requestedStatus,
            transitId
        } = req.body;

        const isCreatedByStore =
            creatorType === 'store' ||
            req.user?.userType === 'store' ||
            requestedStatus === 'moved' ||
            String(createdBy).toLowerCase() === 'store';

        if (!saleIds || !Array.isArray(saleIds) || saleIds.length === 0) {
            return res.status(400).json({
                status: false,
                message: "No sales selected for transit creation",
                data: []
            });
        }

        if (!proof) {
            return res.status(400).json({
                status: false,
                message: "Proof document is mandatory",
                data: []
            });
        }

        // Find all selected sales and populate branch
        const sales = await salesModel.find({ _id: { $in: saleIds } })
            .populate('branch', 'branchName branchId');

        if (!sales || sales.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Selected sales could not be found",
                data: []
            });
        }

        // Group sales by branch ID
        const branchGroups = {};
        for (const sale of sales) {
            const branchId = String(sale.branch?._id || sale.branch);
            if (!branchGroups[branchId]) {
                branchGroups[branchId] = [];
            }
            branchGroups[branchId].push(sale);
        }

        const createdTransits = [];

        // Helper to generate a candidate unique transit ID
        const generateCandidateId = async () => {
            for (let digits = 4; digits <= 10; digits++) {
                const min = Math.pow(10, digits - 1);
                const max = Math.pow(10, digits) - 1;
                for (let attempt = 0; attempt < 50; attempt++) {
                    const randNum = Math.floor(min + Math.random() * (max - min + 1));
                    const candidate = `TR${randNum}`;
                    const exists = await transitModel.findOne({ transitId: candidate }).lean();
                    if (!exists) {
                        return candidate;
                    }
                }
            }
            return `TR${Date.now()}`;
        };

        for (const [branchId, bSales] of Object.entries(branchGroups)) {
            let totalNetWeight = 0;
            let totalGrossWeight = 0;
            let numberOfOrnaments = 0;
            let physicalCount = 0;
            let releaseCount = 0;
            let minDate = null;
            let maxDate = null;
            const bSaleIds = [];

            for (const s of bSales) {
                bSaleIds.push(s._id);
                totalNetWeight += Number(s.netWeight || 0);

                const orns = s.ornaments || [];
                let sGross = 0;
                let sOrnCount = 0;
                if (Array.isArray(orns) && orns.length > 0) {
                    for (const o of orns) {
                        sGross += Number(o.grossWeight || o.netWeight || 0);
                        sOrnCount += Number(o.quantity || 1);
                    }
                } else {
                    sGross = Number(s.grossWeight || s.netWeight || 0);
                    sOrnCount = 1;
                }
                totalGrossWeight += sGross;
                numberOfOrnaments += sOrnCount;

                if (s.saleType === 'physical') {
                    physicalCount++;
                } else {
                    releaseCount++;
                }

                const sDate = new Date(s.createdAt);
                if (!minDate || sDate < minDate) minDate = sDate;
                if (!maxDate || sDate > maxDate) maxDate = sDate;
            }

            const fromDate = minDate || new Date();
            const toDate = maxDate || new Date();
            const diffTime = Math.abs(toDate - fromDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const numberOfDays = Math.max(1, diffDays + 1);

            let newTransitId = null;
            if (createdTransits.length === 0 && transitId && typeof transitId === 'string' && transitId.trim()) {
                const candidate = transitId.trim().toUpperCase();
                const exists = await transitModel.findOne({ transitId: candidate }).lean();
                if (!exists) {
                    newTransitId = candidate;
                }
            }
            if (!newTransitId) {
                newTransitId = await generateCandidateId();
            }

            const transitPayload = {
                transitId: newTransitId,
                branch: branchId,
                saleIds: bSaleIds,
                numberOfPackets: bSales.length,
                physical: physicalCount,
                released: releaseCount,
                numberOfOrnaments: numberOfOrnaments,
                totalGrossWeight: Number(totalGrossWeight.toFixed(3)),
                totalNetWeight: Number(totalNetWeight.toFixed(3)),
                fromDate,
                toDate,
                numberOfDays,
                packetWeight: [Number(totalGrossWeight.toFixed(3))],
                deliveryBy: deliveryBy || "Hand Delivery",
                transitMovedThrough: transitMovedThrough || "Hand Delivery",
                notes: notes || "",
                proof: proof,
                status: isCreatedByStore ? "moved" : "intransit",
                storeReceived: isCreatedByStore ? true : false,
                storeReceivedAt: isCreatedByStore ? new Date() : undefined,
                storeReceivedBy: isCreatedByStore ? (req.user?._id || createdBy) : undefined,
                storeProof: isCreatedByStore ? proof : undefined,
                storeNotes: isCreatedByStore ? (notes || "Direct Store Entry") : "",
                deviations: "no",
                storeDeviations: "no",
                createdBy: createdBy || req.user?._id || "store"
            };

            if (isCreatedByStore) {
                transitPayload.deviationLogs = [
                    {
                        actionBy: req.user?._id || createdBy,
                        userType: 'store',
                        action: 'store_create_and_receive',
                        deviation: 'no',
                        status: 'moved',
                        notes: notes || 'Direct Store Entry',
                        proof: proof || null,
                        createdAt: new Date()
                    }
                ];
            }

            const newTransit = await transitModel.create(transitPayload);
            const targetSaleStatus = isCreatedByStore ? 'moved' : 'intransit';
            await salesModel.updateMany({ _id: { $in: bSaleIds } }, { status: targetSaleStatus });
            if (isCreatedByStore) {
                await assignArticleNumbersToSales(bSaleIds);
            }

            createdTransits.push(newTransit);
        }

        const transitIdsList = createdTransits.map(t => t.transitId).join(", ");
        const statusMsg = isCreatedByStore ? "and moved into Store custody" : "for dispatch";
        res.json({
            status: true,
            message: `Successfully created ${createdTransits.length} transit(s) (${transitIdsList}) ${statusMsg}!`,
            data: createdTransits
        });
    } catch (err) {
        console.error("Error in batchCreateTransitData:", err);
        res.status(500).json({
            status: false,
            message: err.message,
            data: []
        });
    }
}


exports.deleteTransitById = async (req,res)=>{
    try{
        const deleteData = await transitModel.findByIdAndDelete(req.params.id)
        res.json({
            status:true,
            message:"",
            data:deleteData
        })
    }catch(err){
        res.json({
            status:false,
            message:err.message,
            data:{}
        })
    }
}

exports.updateTransitData = async (req, res) => {
    try {
        const updateData = await transitModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({
            status: true,
            message: "Transit updated successfully",
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


exports.findTransitData = async (req,res)=>{
    try{
        let query = (req.method === 'POST' ? req.body : req.query) || {};
        const branchId = req.user?.branch?._id || req.user?.branch;
        if (branchId) {
            query.branch = branchId;
        }
        console.log("Transit Query:", query);
        const findData = await transitModel.find(query)
            .populate('branch', 'branchName branchId')
            .populate({
                path: 'saleIds',
                select: 'ornaments billId articleNumber'
            })
            .sort({ createdAt: -1 });
        console.log("Transit FindData Length:", findData.length);

        const transitIds = findData.map(t => t._id);
        const meltingModel = require('../../models/melting');
        const meltBatches = await meltingModel.find({ transitIds: { $in: transitIds } }).lean().exec();
        // Map transit _id -> melt batch
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
                doc.meltingStatus = meltBatch ? 'partial' : 'partial';
            } else {
                doc.isMelted = false;
                doc.meltingStatus = 'unmelted';
            }
            doc.meltRecord = meltBatch || null;
            return doc;
        });

        res.json({
            status:true,
            message:"",
            data:formattedData
        })
    }catch(err){
        res.status(500).json({
            status:false,
            message:err.message,
            data:[]
        })
    }
}

exports.getTransitById = async (req, res) => {
    try {
        const data = await transitModel.findById(req.params.id)
            .populate('branch')
            .populate({ path: 'saleIds', populate: { path: 'customer' } });
            
        if (!data) {
            return res.json({ status: false, message: "Transit not found", data: {} });
        }

        // We need employee data for createdBy. 
        // createdBy is stored as String, but it is actually the user _id. 
        const userModel = require('../../models/user');
        const employeeModel = require('../../models/employee');
        let employee = null;
        if (data.createdBy) {
             const user = await userModel.findById(data.createdBy);
             if (user && user.employee) {
                 employee = await employeeModel.findById(user.employee);
             }
        }

        const responseData = data.toObject();
        responseData.createdEmployee = employee;

        res.json({
            status: true,
            message: "",
            data: responseData
        });
    } catch (err) {
        res.json({
            status: false,
            message: err.message,
            data: {}
        });
    }
}

exports.generateTransitId = async (req, res) => {
    try {
        // Start with 4 random digits (1000 - 9999).
        // If random 4-digit numbers are reached / already taken in DB,
        // move to 5 digits (10000 - 99999), 6 digits, or more.
        for (let digits = 4; digits <= 10; digits++) {
            const min = Math.pow(10, digits - 1);
            const max = Math.pow(10, digits) - 1;
            for (let attempt = 0; attempt < 50; attempt++) {
                const randNum = Math.floor(min + Math.random() * (max - min + 1));
                const candidate = `TR${randNum}`;
                const exists = await transitModel.findOne({ transitId: candidate }).lean();
                if (!exists) {
                    return res.json({
                        status: true,
                        transitId: candidate
                    });
                }
            }
        }
        return res.json({
            status: true,
            transitId: `TR${Date.now()}`
        });
    } catch (err) {
        return res.json({
            status: false,
            message: err.message,
            transitId: `TR${Math.floor(1000 + Math.random() * 9000)}`
        });
    }
};