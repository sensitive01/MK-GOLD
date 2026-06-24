const mongoose = require("mongoose");

const meltingSchema = new mongoose.Schema({
    transitIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transits',
        required: true
    }],
    transitId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transits'
    },
    saleIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'sales',
        required: true
    }],
    ornaments: [{
        saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'sales' },
        ornamentId: { type: mongoose.Schema.Types.ObjectId },
        ornamentType: { type: String },
        grossWeight: { type: Number },
        netWeight: { type: Number },
        purity: { type: Number },
        netAmount: { type: Number }
    }],
    totalOrnaments: {
        type: Number,
        required: true
    },
    totalGrossWeight: {
        type: Number,
        required: true
    },
    totalNetWeight: {
        type: Number,
        required: true
    },
    totalNetAmount: {
        type: Number,
        required: true
    },
    notes: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: 'melted'
    },
    barWeight: {
        type: Number
    },
    barPurity: {
        type: Number
    },
    weightDifference: {
        type: Number
    },
    purityDifference: {
        type: Number
    },
    fineGoldDifference: {
        type: Number
    },
    meltUpdateNotes: {
        type: String
    },
    meltProof: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'fileuploads'
    },
    meltUpdatedAt: {
        type: Date
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'vendors'
    },
    goldRate: {
        type: Number
    },
    sellAmount: {
        type: Number
    },
    paymentMode: {
        type: String
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employees'
    }
}, { timestamps: true });

module.exports = mongoose.model("meltings", meltingSchema);
