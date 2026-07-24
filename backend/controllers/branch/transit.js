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
        const findData = await transitModel.find(query).sort({ createdAt: -1 });
        console.log("Transit FindData Length:", findData.length);
        res.json({
            status:true,
            message:"",
            data:findData
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