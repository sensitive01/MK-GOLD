const mongoose = require('mongoose');

const check = async () => {
    try {
        await mongoose.connect('mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold');
        const Designation = mongoose.model('Designation', new mongoose.Schema({ name: String, status: String }));
        const data = await Designation.find({});
        console.log("Designations found:", data);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

check();
