const mongoose = require('mongoose');

const add = async () => {
    try {
        await mongoose.connect('mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold');
        const schema = new mongoose.Schema({ name: String, status: String }, { timestamps: true });
        const Designation = mongoose.model('designations', schema); // Collection name is designations
        const item = new Designation({ name: 'Tester', status: 'active' });
        await item.save();
        console.log("Designation added!");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
};

add();
