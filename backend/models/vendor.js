const mongoose = require("mongoose");

const vendorSchema = new mongoose.Schema({
    vendorId: {
        type: String,
        unique: true,
        required: true
    },
    vendorIdSeq: {
        type: Number,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    contactPerson: {
        type: String
    },
    phoneNumber: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String
    },
    gstNumber: {
        type: String
    },
    address: {
        type: String
    },
    city: {
        type: String
    },
    state: {
        type: String
    },
    status: {
        type: String,
        default: 'active' // 'active' or 'inactive'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'employees'
    }
}, { timestamps: true });

module.exports = mongoose.model("vendors", vendorSchema);
