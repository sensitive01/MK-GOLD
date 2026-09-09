const transitModel = require("../../models/transit")
const salesModel = require("../../models/sales")

exports.createTransitData = async (req,res)=>{
    try{
        const createData = await transitModel.create(
            req.body
        )
        // Update the corresponding sales' statuses
        if (req.body.saleIds && req.body.saleIds.length > 0) {
            await salesModel.updateMany({ _id: { $in: req.body.saleIds } }, { status: 'intransit' });
        }
        
        res.json({
            status:true,
            message:"",
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

exports.findTransitData = async (req,res)=>{
    try{
        let query = req.body || {};
        if (req.user?.branch?._id) {
            query.branch = req.user.branch._id;
        }
        console.log("Transit Query:", query);
        const findData = await transitModel.find(query)
            .populate('branch', 'branchName branchId')
            .populate({
                path: 'saleIds',
                select: 'ornaments billId'
            })
            .sort({ createdAt: -1 });
        console.log("Transit FindData Length:", findData.length);

        const formattedData = findData.map(item => {
            const doc = item.toObject();
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
            if (doc.status === 'melted' || (totalOrns > 0 && meltedOrns === totalOrns)) {
                doc.isMelted = true;
                doc.meltingStatus = 'melted';
            } else if (meltedOrns > 0) {
                doc.isMelted = false;
                doc.meltingStatus = 'partial';
            } else {
                doc.isMelted = false;
                doc.meltingStatus = 'unmelted';
            }
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