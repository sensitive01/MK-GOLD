const mongoose = require("mongoose");

const transitSchema = new mongoose.Schema({
    transitId : {
        unique:true,
        required:true,
        type:String
    },
    saleIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sales',
        required: true
    }],
    numberOfPackets : {
        required:true,
        type:Number,
    },
    physical:{
        type:Number,
        required:true
    },
    released:{
        type:Number,
        required:true
    },
    numberOfOrnaments:{
        type:Number,
        required:true

    },
    totalGrossWeight:{
        type:Number,
        required:true
    },
    totalNetWeight:{
        type:Number,
        required:true
    },
    fromDate:{
        type:Date,
        required:true
    },
    toDate:{
        type:Date,
        required:true
    },
    numberOfDays:{
        type:Number,
        required:true
    },
    packetWeight : {
        type:[Number],
        required:true
    },
    deliveryBy:{
        type:String,
        required:true
    },
    notes:{
        type:String,
        default:""
    },
    proof:{
        required:true,
        type:mongoose.Schema.Types.ObjectId,
        ref: 'fileuploads'
    },
    deviations: {
        type: String,
        enum: ['yes', 'no'],
        default: 'no'
    },
    receivedNotes: {
        type: String,
        default: ""
    },
    receivedProof: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fileuploads'
    },
    status :{
        type:String,
        required:true
    },
    branch:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'branches',
        required:true
    },
    createdBy:{
        type:String,
        required:true
    }
}, { timestamps: true })

module.exports = mongoose.model( "Transits", transitSchema )